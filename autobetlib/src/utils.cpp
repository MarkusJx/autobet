#include <utility>
#include <vector>
#include <thread>
#include <iomanip>
#include <sstream>

#include "utils.hpp"

#ifdef AUTOBET_WINDOWS

#include <Windows.h>
#include <TlHelp32.h>
#include <atlimage.h>
#include <iostream>
#include <shlobj.h>

#include "logger.hpp"

RECT rect;
#define GTA5_EXE L"GTA5.exe"
#define GTA5_NAME L"Grand Theft Auto V"
#endif

std::function<void()> clbk = {};

using namespace logger;

std::string utils::IPv4::to_string() const {
    std::stringstream stringstream;
    stringstream << std::to_string(b1) << "." << std::to_string(b2) << ".";
    stringstream << std::to_string(b3) << "." << std::to_string(b4);

    return stringstream.str();
}

bool WINAPI CtrlHandler(unsigned long fdwCtrlType) {
    if (fdwCtrlType == 0 || fdwCtrlType == 2) {
        clbk();
        return true;
    } else if (fdwCtrlType == 1 || fdwCtrlType == 5 || fdwCtrlType == 6) {
        clbk();
        return false;
    } else {
        return false;
    }
}

void utils::setCtrlCHandler(std::function<void()> callback) {
    clbk = std::move(callback);
    if (SetConsoleCtrlHandler(reinterpret_cast<PHANDLER_ROUTINE>(CtrlHandler), true)) {
        StaticLogger::debug("Successfully initiated Ctrl-C handler");
    } else {
        StaticLogger::warning("Could not initiate Ctrl-C handler");
    }
}

errno_t utils::getDesktopDirectory(std::string &arr) {
    wchar_t path[MAX_PATH + 1] = {0};

    if (SHGetFolderPathW(nullptr, CSIDL_DESKTOP, nullptr, 0, path) != S_OK) {
        return -1;
    }

    int pathlen = lstrlenW(path);

    arr.resize(261);
    int len = WideCharToMultiByte(CP_UTF8, 0, path, pathlen, arr.data(), arr.size(), nullptr, nullptr);
    if (len <= 0) {
        return -1;
    }

    if (!arr.data())
        ++len;

    arr.resize(len);
    return 0;
}

void utils::setDpiAware() {
#ifdef AUTOBET_WINDOWS
    if (SetProcessDPIAware()) {
        StaticLogger::debug("Made process DPI aware");
    } else {
        StaticLogger::warning("Could not make process DPI aware");
    }
#else
    ulogger->Unimplemented();
#endif
}

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

errno_t utils::isForeground(bool& res) {
    HWND h = GetForegroundWindow();
    if (h != nullptr) {
        std::wstring title(GetWindowTextLength(h) + 1, L'\0');
        GetWindowTextW(h, &title[0], title.size()); //note: C++11 only
        res = wcscmp(title.c_str(), L"Grand Theft Auto V") == 0;

        return 0;
    } else {
        res = false;
        return 1;
    }
}

utils::bitmap utils::convertHBitmap(int width, int height, void *HBMP) {
    return crop(0, 0, width, height, HBMP);
}

utils::bitmap utils::crop(int x, int y, int width, int height, void *src) {
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

    bitmap buf;
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
    IStream_Read(stream, buf.data(), len);
    stream->Release();

    return buf;
}

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

bool utils::pressTab() {
    INPUT input;
    WORD v_key = VK_TAB;
    input.type = INPUT_KEYBOARD;
    input.ki.wScan = MapVirtualKey(v_key, MAPVK_VK_TO_VSC);
    input.ki.time = 0;
    input.ki.dwExtraInfo = 0;
    input.ki.wVk = v_key;
    input.ki.dwFlags = 0;
    errno_t err = SendInput(1, &input, sizeof(INPUT));

    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    input.ki.dwFlags = KEYEVENTF_KEYUP;
    err += SendInput(1, &input, sizeof(INPUT));
    return err == 2;
}

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
            StaticLogger::warning("System has less than 4G of RAM installed.");
        }
        stream << "\t\tInstalled memory: ";
        stream << std::fixed << std::setprecision(2) << installedMemory << "G" << std::endl;
    } else {
        StaticLogger::warning("Could not retrieve installed memory");
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
    StaticLogger::debug(stream.str());
    stream.clear();
}

bool utils::fileExists(const std::string &name) {
    struct stat buffer{};
    return (stat(name.c_str(), &buffer) == 0);
}

void utils::getActiveScreen(unsigned int xPos, unsigned int yPos, utils::windowSize &ws) {
    MONITORINFO target;
    target.cbSize = sizeof(MONITORINFO);
    POINT p;
    p.x = xPos;
    p.y = yPos;

    HMONITOR hMon = MonitorFromPoint(p, MONITOR_DEFAULTTONEAREST);
    GetMonitorInfo(hMon, &target);

    ws.height = abs(target.rcMonitor.top - target.rcMonitor.bottom);
    ws.width = abs(target.rcMonitor.right - target.rcMonitor.left);
    ws.xPos = target.rcMonitor.left;
    ws.yPos = target.rcMonitor.bottom;
}

bool utils::isAlreadyRunning(const std::string &programName) {
    std::string addr = "Local\\";
    addr.append(programName);
    CreateMutexA(nullptr, false, addr.c_str());
    return GetLastError() == ERROR_ALREADY_EXISTS;
}
