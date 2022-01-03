#include <utility>
#include <vector>
#include <thread>
#include <iomanip>

#include <Windows.h>
#include <atlimage.h>
#include <iostream>
#include <shlobj.h>
#include <filesystem>

#include "variables.hpp"
#include "logger.hpp"
#include "util/utils.hpp"
#include "storage/settings.hpp"
#include "windowUtils.hpp"
#include "util/iputil.hpp"

std::function<void()> clbk = {};
std::unique_ptr<windowUtils::processInfo> processInfo = nullptr;

using namespace logger;

/**
 * Generate a processInfo class for the game
 *
 * @return whether the game could be found and the info was generated
 */
bool generateProcessInfo() {
    try {
        std::string program_name = variables::game_program_name.load();
        std::string process_name = variables::game_process_name.load();
        if (processInfo && processInfo->getProgramName() == program_name &&
            processInfo->getWindowName() == process_name && processInfo->isValid()) {
            return true;
        }

        windowUtils::windowsProgramInfo info(program_name);
        for (auto &&p: info.getProcesses()) {
            if (p->getWindowName() == process_name) {
                processInfo = std::move(p);
                return true;
            }
        }

        processInfo = nullptr;
        return false;
    } catch (...) {
        processInfo = nullptr;
        return false;
    }
}

std::string utils::IPv4::to_string() const {
    std::stringstream stringstream;
    stringstream << std::to_string(b1) << "." << std::to_string(b2) << ".";
    stringstream << std::to_string(b3) << "." << std::to_string(b4);

    return stringstream.str();
}

std::string utils::getIP() {
    if (settings::has_key(AUTOBET_SETTINGS_WEB_UI_IP)) {
        return settings::read<std::string>(AUTOBET_SETTINGS_WEB_UI_IP);
    } else {
        try {
            return markusjx::autobet::iputil::get_ip();
        } catch (std::exception &e) {
            logger::StaticLogger::errorStream() << "Could not retrieve this pc's ip using boost::asio: " << e.what();

            utils::IPv4 iPv4;
            if (!utils::getOwnIP(iPv4)) {
                StaticLogger::error("Could not retrieve own IP!");
                return "";
            }

            return iPv4.to_string();
        }
    }
}

bool utils::openWebsite(const std::string &address) {
    HINSTANCE hst = ShellExecuteA(nullptr, TEXT("open"), TEXT(address.c_str()), nullptr, nullptr, 0);
    return reinterpret_cast<intptr_t>(hst) > 32;
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
    int len = WideCharToMultiByte(CP_UTF8, 0, path, pathlen, arr.data(), static_cast<int>(arr.size()), nullptr,
                                  nullptr);
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

errno_t utils::isForeground(bool &res) {
    HWND h = GetForegroundWindow();
    if (h != nullptr) {
        std::string title(GetWindowTextLengthA(h) + 1, '\0');
        GetWindowTextA(h, title.data(), static_cast<int>(title.size())); //note: C++11 only
        title.resize(strlen(title.c_str()));

        logger::StaticLogger::debugStream() << "Currently focused window: " << title;
        res = strcmp(title.c_str(), variables::game_process_name) == 0;

        return 0;
    } else {
        res = false;
        return 1;
    }
}

utils::bitmap utils::convertHBitmap(int width, int height, const std::shared_ptr<void> &bmp) {
    return crop(0, 0, width, height, bmp);
}

utils::bitmap utils::crop(int x, int y, int width, int height, const std::shared_ptr<void> &src) {
    auto hSource = (HBITMAP) src.get();
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

windowUtils::windowSize utils::getWindowSize() {
    if (generateProcessInfo()) {
        return processInfo->getSize();
    } else {
        return windowUtils::windowSize{0, 0, 0, 0};
    }
}

#ifdef AUTOBET_WINDOWS

void moveMouse(int x, int y, INPUT *inputs) {
    // Get all required system metrics
    const int screenWidth = GetSystemMetrics(SM_CXVIRTUALSCREEN);
    const int screenHeight = GetSystemMetrics(SM_CYVIRTUALSCREEN);
    const int minX = GetSystemMetrics(SM_XVIRTUALSCREEN);
    const int minY = GetSystemMetrics(SM_YVIRTUALSCREEN);

    // Source: https://github.com/octalmage/robotjs/blob/c9cbd98ec47378dfae62871f0f2830782322b06d/src/mouse.c#L133
#define MOUSE_COORD_TO_ABS(coord, width_or_height) ((65536 * (coord) / (width_or_height)) + ((coord) < 0 ? -1 : 1))
    inputs[0].type = INPUT_MOUSE;
    inputs[0].mi.mouseData = 0;
    inputs[0].mi.time = 0;
    inputs[0].mi.dx = MOUSE_COORD_TO_ABS(x - minX, screenWidth);
    inputs[0].mi.dy = MOUSE_COORD_TO_ABS(y - minY, screenHeight);
    // We'll cast everything to unsigned to prevent clang-tidy from complaining
    inputs[0].mi.dwFlags =
            unsigned(MOUSEEVENTF_MOVE) | unsigned(MOUSEEVENTF_VIRTUALDESK) | unsigned(MOUSEEVENTF_ABSOLUTE);
#undef MOUSE_COORD_TO_ABS
}

#endif

bool utils::pressTab(int sleep) {
    INPUT input;
    WORD v_key = VK_TAB;
    input.type = INPUT_KEYBOARD;
    input.ki.wScan = static_cast<WORD>(MapVirtualKey(v_key, MAPVK_VK_TO_VSC));
    input.ki.time = 0;
    input.ki.dwExtraInfo = 0;
    input.ki.wVk = v_key;
    input.ki.dwFlags = 0;
    auto err = static_cast<errno_t>(SendInput(1, &input, sizeof(INPUT)));

    std::this_thread::sleep_for(std::chrono::milliseconds(sleep));

    input.ki.dwFlags = KEYEVENTF_KEYUP;
    err += static_cast<errno_t>(SendInput(1, &input, sizeof(INPUT)));
    return err == 2;
}

bool utils::leftClick(int x, int y, int sleep, bool move) {
    if (move) {
#ifdef AUTOBET_WINDOWS
        INPUT inputs[2] = {0};
        moveMouse(x, y, inputs);

        inputs[1].type = INPUT_MOUSE;
        inputs[1].mi.dwFlags = MOUSEEVENTF_LEFTDOWN;

        int err = static_cast<errno_t>(SendInput(2, inputs, sizeof(INPUT)));

        std::this_thread::sleep_for(std::chrono::milliseconds(sleep));

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

        int err = static_cast<errno_t>(SendInput(1, inputs, sizeof(INPUT)));

        std::this_thread::sleep_for(std::chrono::milliseconds(sleep));

        INPUT _inputs[1] = {0};
        _inputs[0].type = INPUT_MOUSE;
        _inputs[0].mi.dwFlags = MOUSEEVENTF_LEFTUP;

        return err + SendInput(1, _inputs, sizeof(INPUT));
#else
        ulogger->Unimplemented();
#endif
    }
}

bool utils::gameIsRunning() {
    return generateProcessInfo();
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
    unsigned int nExIds;
    char CPUBrandString[0x40];
    // Get the information associated with each extended ID.
    __cpuid(CPUInfo, (signed int) 0x80000000);
    nExIds = CPUInfo[0];
    for (unsigned int i = 0x80000000; i <= nExIds; ++i) {
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

windowUtils::windowSize utils::getActiveScreen(unsigned int xPos, unsigned int yPos) {
    MONITORINFO target;
    target.cbSize = sizeof(MONITORINFO);
    POINT p;
    p.x = static_cast<LONG>(xPos);
    p.y = static_cast<LONG>(yPos);

    HMONITOR hMon = MonitorFromPoint(p, MONITOR_DEFAULTTONEAREST);
    GetMonitorInfo(hMon, &target);

    long height = abs(target.rcMonitor.top - target.rcMonitor.bottom);
    long width = abs(target.rcMonitor.right - target.rcMonitor.left);
    long _xPos = target.rcMonitor.left;
    long _yPos = target.rcMonitor.bottom;

    return windowUtils::windowSize{_xPos, _yPos, width, height};
}

bool utils::isAlreadyRunning(const std::string &programName) {
    std::string addr = "Local\\";
    addr.append(programName);
    CreateMutexA(nullptr, false, addr.c_str());
    return GetLastError() == ERROR_ALREADY_EXISTS;
}

std::string utils::getDocumentsFolder() {
    std::string res(MAX_PATH, '\0');
    HRESULT result = SHGetFolderPathA(nullptr, CSIDL_MYDOCUMENTS, nullptr, SHGFP_TYPE_CURRENT, res.data());

    if (result != S_OK) {
        return {};
    } else {
        res.resize(strlen(res.c_str()));
        return res;
    }
}

std::string utils::get_or_create_documents_folder() {
    const std::string documents = utils::getDocumentsFolder();

    if (documents.empty()) {
        throw std::runtime_error("Could not get the documents folder");
    }

    const std::string dir = documents + "\\autobet";
    if (!utils::fileExists(dir) && !std::filesystem::create_directory(dir)) {
        throw std::runtime_error("Could not create the autobet directory");
    } else {
        return dir;
    }
}
