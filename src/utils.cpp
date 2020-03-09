//
// Created by markus on 27/12/2019.
//

#include <utility>
#include <vector>
#include <thread>
#include <iomanip>

#include "utils.hpp"
#include "main.hpp"

#ifdef AUTOBET_WINDOWS

#include <Windows.h>
#include <TlHelp32.h>
#include <atlimage.h>
#include <iostream>
#include <shlobj.h>
#include <fstream>

RECT rect;
//#define GTA5_EXE L"mspaint.exe"
//#define GTA5_NAME L"1.jpg - Paint"
#define GTA5_EXE L"GTA5.exe"
#define GTA5_NAME L"Grand Theft Auto V"
#endif

Logger *ulogger;

void utils::setLogger(Logger *_logger) {
    ulogger = _logger;
}

/**
 * Gets the path to the current users Desktop
 * Source: https://stackoverflow.com/a/17935926
 *
 * @param arr A path object
 * @return a error code or 0 if everything is ok
 */
errno_t utils::getDesktopDirectory(utils::path &arr) {
    wchar_t path[MAX_PATH + 1] = {0};

    if (SHGetFolderPathW(nullptr, CSIDL_DESKTOP, nullptr, 0, path) != S_OK) {
        return -1;
    }

    int pathlen = lstrlenW(path);

    int len = WideCharToMultiByte(CP_UTF8, 0, path, pathlen, arr.data, arr.size, nullptr, nullptr);
    if (len <= 0) {
        return -1;
    }

    if (!arr.data)
        ++len;
    else if (len < arr.size)
        arr[len] = 0;

    return arr.resize(len + 1);
}

// Application class ================================================
/**
 * the Application class constructor
 *
 * @param appName the path of the application to start
 */
utils::Application::Application(const std::string &appName) {
    name = appName;
    auto *pI = (PROCESS_INFORMATION *) calloc(1, sizeof(PROCESS_INFORMATION));
    if (!pI) {
        throw std::bad_alloc();
    }
    pi = static_cast<void *>(pI);
}

/**
 * Check if the application is still running
 *
 * @return if the application is running
 */
bool utils::Application::isRunning() {
    unsigned long exitCode = 0L;
    if (GetExitCodeProcess(static_cast<PROCESS_INFORMATION *>(pi)->hProcess, &exitCode)) {
        return exitCode == STILL_ACTIVE;
    } else {
        return false;
    }
}

/**
 * Kill the application
 *
 * @return if the operation was successful
 */
bool utils::Application::kill() {
    return TerminateProcess(static_cast<PROCESS_INFORMATION *>(pi)->hProcess, 1);
}

/**
 * the application class destructor
 */
utils::Application::~Application() {
    auto *p = static_cast<PROCESS_INFORMATION *>(pi);
    CloseHandle(p->hProcess);
    CloseHandle(p->hThread);
    free(pi);
}
// ==================================================================

/**
 * set this process DPI aware
 */
void utils::setDpiAware() {
#ifdef AUTOBET_WINDOWS
    if (SetProcessDPIAware()) {
        ulogger->Debug("Made process DPI aware");
    } else {
        ulogger->Warning("Could not make process DPI aware");
    }
#else
    ulogger->Unimplemented();
#endif
}

/**
 * Get this machine's IP address
 * Source: https://stackoverflow.com/a/122225
 *
 * @param myIP a IPv4 struct
 * @return if the operation was successful
 */
bool utils::getOwnIP(utils::IPv4 &myIP) {
    char szBuffer[1024];

#ifdef WIN32
    WSADATA wsaData;
    WORD wVersionRequested = MAKEWORD(2, 0);
    if (::WSAStartup(wVersionRequested, &wsaData) != 0)
        return false;
#endif


    if (gethostname(szBuffer, sizeof(szBuffer)) == SOCKET_ERROR) {
#ifdef WIN32
        WSACleanup();
#endif
        return false;
    }

    struct hostent *host = gethostbyname(szBuffer);
    if (host == nullptr) {
#ifdef WIN32
        WSACleanup();
#endif
        return false;
    }

    //Obtain the computer's IP
    myIP.b1 = ((struct in_addr *) (host->h_addr))->S_un.S_un_b.s_b1;
    myIP.b2 = ((struct in_addr *) (host->h_addr))->S_un.S_un_b.s_b2;
    myIP.b3 = ((struct in_addr *) (host->h_addr))->S_un.S_un_b.s_b3;
    myIP.b4 = ((struct in_addr *) (host->h_addr))->S_un.S_un_b.s_b4;

#ifdef WIN32
    WSACleanup();
#endif
    return true;
}

/**
 * Save a utils::bitmap to a image
 *
 * @param path the path to store the image, without file ending
 * @param bmp the bitmap object
 */
/*void utils::saveBmp(std::string path, bitmap *bmp) {
    std::fstream fi;
    path.append(".png");
    fi.open(path, std::fstream::binary | std::fstream::out);
    fi.write(bmp->data, bmp->size);
    fi.close();
}

void utils::saveHBitmap(std::string path, int width, int height, void *HBMP) {
    bitmap *b = crop(0, 0, width, height, HBMP);
    saveBmp(std::move(path), b);
    delete b;
}*/

utils::bitmap *utils::convertHBitmap(int width, int height, void *HBMP) {
    return crop(0, 0, width, height, HBMP);
}

utils::bitmap *utils::crop(int x, int y, int width, int height, void *src) {
    auto hSource = (HBITMAP) src;
    HDC hdcMem, hdcMem2;
    // Get some HDCs that are compatible with the display driver

    auto hClone = (HBITMAP) CopyImage(hSource, IMAGE_BITMAP, width, height,
                                      LR_CREATEDIBSECTION);

    hdcMem = CreateCompatibleDC(nullptr);
    hdcMem2 = CreateCompatibleDC(nullptr);

    auto hOldBmp = (HBITMAP) SelectObject(hdcMem, hSource);
    auto hOldBmp2 = (HBITMAP) SelectObject(hdcMem2, hClone);

    BitBlt(hdcMem2, 0, 0, width, height, hdcMem, x, y, SRCCOPY);

    // Clean up.
    SelectObject(hdcMem, hOldBmp);
    SelectObject(hdcMem2, hOldBmp2);

    DeleteDC(hdcMem);
    DeleteDC(hdcMem2);

    std::vector<BYTE> buf;
    IStream *stream = nullptr;
    CreateStreamOnHGlobal(nullptr, TRUE, &stream);
    CImage image;
    ULARGE_INTEGER liSize;

    // screenshot to png and save to stream
    image.Attach(hClone);
    image.Save(stream, Gdiplus::ImageFormatPNG);
    IStream_Size(stream, &liSize);
    DWORD len = liSize.LowPart;
    IStream_Reset(stream);
    buf.resize(len);
    IStream_Read(stream, &buf[0], len);
    stream->Release();

    auto tmp = new utils::bitmap(reinterpret_cast<char *>(&buf[0]), buf.size() * sizeof(BYTE));
    std::vector<BYTE>().swap(buf);
    return tmp;
}

/**
 * Take a Screenshot and return its HBITMAP as a void pointer
 * Source: https://stackoverflow.com/a/55938188
 *
 * @param x the x-Position on the screen
 * @param y the y-Position on the screen
 * @param width the width of the screenshot
 * @param height the height of the screenshot
 * @return the image HBITMAP as void pointer
 */
void *utils::TakeScreenShot(int x, int y, int width, int height) {
#ifdef AUTOBET_WINDOWS
    // get the device context of the screen
    HDC hScreenDC = CreateDC("DISPLAY", nullptr, nullptr, nullptr);
    // and a device context to put it in
    HDC hMemoryDC = CreateCompatibleDC(hScreenDC);

    // maybe worth checking these are positive values
    HBITMAP hBitmap = CreateCompatibleBitmap(hScreenDC, width, height);

    // get a new bitmap
    auto hOldBitmap = (HBITMAP) SelectObject(hMemoryDC, hBitmap);

    BitBlt(hMemoryDC, 0, 0, width, height, hScreenDC, x, y, SRCCOPY);
    return (void *) SelectObject(hMemoryDC, hOldBitmap);
#else
    ulogger->Warning("TakeScreenShot is only available on windows");
#endif
}

#ifdef AUTOBET_WINDOWS

bool isGTA(const PROCESSENTRY32W &entry) {
    return std::wstring(entry.szExeFile) == GTA5_EXE;
}

BOOL CALLBACK enumWindowsProc(HWND hwnd, LPARAM lParam) {
    const auto &pids = *reinterpret_cast<std::vector<DWORD> *>(lParam);

    DWORD winId;
    GetWindowThreadProcessId(hwnd, &winId);

    for (DWORD pid : pids) {
        if (winId == pid) {
            std::wstring title(GetWindowTextLength(hwnd) + 1, L'\0');
            GetWindowTextW(hwnd, &title[0], static_cast<int>(title.size())); //note: C++11 only

            if (wcscmp(title.c_str(), GTA5_NAME) == 0) {
                GetWindowRect(hwnd, &rect);
                RECT r;
                GetClientRect(hwnd, &r);

                int h = r.bottom - r.top;
                int w = r.right - r.left;

                rect.top = rect.bottom - h;
                rect.left = rect.right - w;

                return TRUE;
            }
        }
    }

    return TRUE;
}

#endif

void utils::getWindowSize(utils::windowSize &ws) {
#ifdef AUTOBET_WINDOWS
    std::vector<DWORD> pids;

    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

    PROCESSENTRY32W entry;
    entry.dwSize = sizeof entry;

    if (!Process32FirstW(snap, &entry)) {
        ws.xPos = ws.yPos = ws.width = ws.height = 0;
        return;
    }

    do {
        if (isGTA(entry)) {
            pids.emplace_back(entry.th32ProcessID);
        }
    } while (Process32NextW(snap, &entry));

    EnumWindows(enumWindowsProc, reinterpret_cast<LPARAM>(&pids));

    // If all values of rect are set to 0 the window is considered not existing
    if (!(rect.left + rect.top + rect.bottom + rect.right)) {
        ws.xPos = ws.yPos = ws.width = ws.height = 0;
        return;
    }

    ws.xPos = rect.left;
    ws.yPos = rect.top;
    ws.width = rect.right - rect.left;
    ws.height = rect.bottom - rect.top;

    // Set all values of rect to zero
    rect.left = rect.top = rect.right = rect.bottom = 0;
#else
    ulogger->Unimplemented();
    return nullptr;
#endif
}

#ifdef AUTOBET_WINDOWS

void moveMouse(int x, int y, INPUT *inputs) {
    inputs[0].type = INPUT_MOUSE;
    inputs[0].mi.mouseData = 0;
    inputs[0].mi.time = 0;
    inputs[0].mi.dx = x * (65536 / GetSystemMetrics(SM_CXVIRTUALSCREEN));
    inputs[0].mi.dy = y * (65536 / GetSystemMetrics(SM_CYVIRTUALSCREEN));
    inputs[0].mi.dwFlags =
            unsigned(MOUSEEVENTF_MOVE) | unsigned(MOUSEEVENTF_VIRTUALDESK) | unsigned(MOUSEEVENTF_ABSOLUTE);
}

#endif

#ifdef UNDEFINED // Remove this if not used
bool utils::rightClick(int x, int y) {
#ifdef AUTOBET_WINDOWS
    INPUT inputs[3] = {0};
    moveMouse(x, y, inputs);

    inputs[1].type = INPUT_MOUSE;
    inputs[1].mi.dwFlags = MOUSEEVENTF_RIGHTDOWN;

    inputs[2].type = INPUT_MOUSE;
    inputs[2].mi.dwFlags = MOUSEEVENTF_RIGHTUP;

    return SendInput(3, inputs, sizeof(INPUT));
#else
    ulogger->Unimplemented();
#endif
}
#endif

bool utils::leftClick(int x, int y, bool move) {
    if (move) {
#ifdef AUTOBET_WINDOWS
        INPUT inputs[2] = {0};
        moveMouse(x, y, inputs);

        inputs[1].type = INPUT_MOUSE;
        inputs[1].mi.dwFlags = MOUSEEVENTF_LEFTDOWN;

        int err = SendInput(2, inputs, sizeof(INPUT));

        std::this_thread::sleep_for(std::chrono::milliseconds(100));

        INPUT _inputs[1] = {0};
        _inputs[0].type = INPUT_MOUSE;
        _inputs[0].mi.dwFlags = MOUSEEVENTF_LEFTUP;

        return err + SendInput(1, _inputs, sizeof(INPUT));
#else
        ulogger->Unimplemented();
#endif
    } else {
#ifdef AUTOBET_WINDOWS
        INPUT inputs[1] = {0};

        inputs[0].type = INPUT_MOUSE;
        inputs[0].mi.dwFlags = MOUSEEVENTF_LEFTDOWN;

        int err = SendInput(1, inputs, sizeof(INPUT));

        std::this_thread::sleep_for(std::chrono::milliseconds(250));

        INPUT _inputs[1] = {0};
        _inputs[0].type = INPUT_MOUSE;
        _inputs[0].mi.dwFlags = MOUSEEVENTF_LEFTUP;

        return err + SendInput(1, _inputs, sizeof(INPUT));
#else
        ulogger->Unimplemented();
#endif
    }
}

/**
 * Start a application by name. Source: https://stackoverflow.com/a/15440094
 *
 * @param lpApplicationName the name of the application to start
 */
bool utils::startup(utils::Application *application, const char *args) {
#ifdef AUTOBET_WINDOWS
    // additional information
    STARTUPINFOA si;
    auto *pi = static_cast<PROCESS_INFORMATION *>(application->pi);

    char *_args;
    if (args) {
        std::string ar(" ");
        ar.append(args);

        _args = _strdup(ar.c_str());
    } else {
        _args = nullptr;
    }

    // set the size of the structures
    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    ZeroMemory(pi, sizeof(*pi));

    // start the program up
    bool res = CreateProcessA(application->name.c_str(), _args, nullptr, nullptr, FALSE,
                              CREATE_NEW_CONSOLE, nullptr, nullptr, &si, pi);
    free(_args);
    return res;
#else
    ulogger->Unimplemented();
#endif
}

bool utils::isProcessRunning(const char *processName) {
#ifdef AUTOBET_WINDOWS
    PROCESSENTRY32 entry;
    entry.dwSize = sizeof(PROCESSENTRY32);

    const auto snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, NULL);

    if (!Process32First(snapshot, &entry)) {
        CloseHandle(snapshot);
        return false;
    }

    do {
        if (!_tcsicmp(entry.szExeFile, processName)) {
            CloseHandle(snapshot);
            return true;
        }
    } while (Process32Next(snapshot, &entry));

    CloseHandle(snapshot);
    return false;
#else
    ulogger->Unimplemented();
#endif
}

int utils::displayError(const std::string &error, const std::function<void()> &callback) {
#ifdef AUTOBET_WINDOWS
    int msgboxID = MessageBox(
            nullptr,
            error.c_str(),
            "Autobet - Error",
            unsigned(MB_ICONWARNING) | unsigned(MB_OK) | unsigned(MB_DEFBUTTON2)
    );

    if (msgboxID == IDOK && callback != nullptr) {
        callback();
    }

    return msgboxID;
#else
    ulogger->Unimplemented();
#endif
}

void utils::printSystemInformation() {
    float installedMemory;
    std::stringstream stream;

    stream << "System information:" << std::endl;
#ifdef AUTOBET_WINDOWS
    unsigned long long size = 0l;
    GetPhysicallyInstalledSystemMemory(&size);
    installedMemory = (float) ((long double) size / 1048576.0);
#else
    installedMemory = -1;
    ulogger->Unimplemented();
#endif

    if (installedMemory != -1) {
        if (installedMemory <= 4.0f) {
            ulogger->Warning("System has less than 4G of RAM installed.");
        }
        stream << "\t\tInstalled memory: ";
        stream << std::fixed << std::setprecision(2) << installedMemory << "G" << std::endl;
    } else {
        ulogger->Warning("Could not retrieve installed memory");
    }

    stream << "\t\tSystem is running on " << (int) (CHAR_BIT * sizeof(void *)) << " bit" << std::endl;

#ifdef AUTOBET_WINDOWS
    int CPUInfo[4] = {-1};
    unsigned nExIds, i = 0;
    char CPUBrandString[0x40];
    // Get the information associated with each extended ID.
    __cpuid(CPUInfo, (signed int) 0x80000000);
    nExIds = CPUInfo[0];
    for (i = 0x80000000; i <= nExIds; ++i) {
        __cpuid(CPUInfo, (signed int) i);
        // Interpret CPU brand string
        if (i == 0x80000002)
            memcpy(CPUBrandString, CPUInfo, sizeof(CPUInfo));
        else if (i == 0x80000003)
            memcpy(CPUBrandString + 16, CPUInfo, sizeof(CPUInfo));
        else if (i == 0x80000004)
            memcpy(CPUBrandString + 32, CPUInfo, sizeof(CPUInfo));
    }
    //string includes manufacturer, model and clock speed
    stream << "\t\tCPU Type: " << CPUBrandString << std::endl;


    SYSTEM_INFO sysInfo;
    GetSystemInfo(&sysInfo);
    stream << "\t\tNumber of Cores: " << sysInfo.dwNumberOfProcessors << std::endl;

    int width = GetSystemMetrics(SM_CXVIRTUALSCREEN);
    int height = GetSystemMetrics(SM_CYVIRTUALSCREEN);
    stream << "\t\tScreen width: " << width << "px" << std::endl;
    stream << "\t\tScreen height: " << height << "px" << std::endl;
#endif

    stream.flush();
    ulogger->Debug(stream.str());
    stream.clear();
}

/**
 * Split a string
 * Source: https://stackoverflow.com/a/14266139
 *
 * @warning the resulting chars must be released with free()
 * @param s the string to split
 * @param delimiter the delimiter
 * @param res a vector to put the result
 */
void utils::splitString(std::string s, const std::string &delimiter, std::vector<char *> *res) {
    size_t pos = 0;
    std::string token;
    while ((pos = s.find(delimiter)) != std::string::npos) {
        token = s.substr(0, pos);
        res->push_back(_strdup(token.c_str()));
        s.erase(0, pos + delimiter.length());
    }

    res->push_back(_strdup(s.c_str()));
}

/**
 * Check if a file exists
 * Source: https://stackoverflow.com/a/12774387
 *
 * @param name the file name
 * @return if the file exists
 */
bool utils::fileExists(const std::string &name) {
    struct stat buffer{};
    return (stat(name.c_str(), &buffer) == 0);
}
