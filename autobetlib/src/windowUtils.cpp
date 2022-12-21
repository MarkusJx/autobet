/*
* MIT License
* Copyright (c) 2020 MarkusJx
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/

#include <Windows.h>
#include <psapi.h>
#include <utility>
#include <vector>
#include <TlHelp32.h>
#include <stdexcept>
#include <iostream>
#include <sstream>
#include <map>

#include "windowUtils.hpp"
#include "util/utils.hpp"

// Basic function definitions =======================================

/**
 * Calculate the window rect of a HWND
 *
 * @param hwnd the hwnd to the window
 * @return the window rect
 */
RECT calculateWindowRect(HWND hwnd) {
    // Get the window rect of the window
    RECT rect{0, 0, 0, 0};
    GetWindowRect(hwnd, &rect);

    // Get the client rect of the window
    RECT r{0, 0, 0, 0};
    GetClientRect(hwnd, &r);

    // Calculate the width and height
    int h = r.bottom - r.top;
    int w = r.right - r.left;

    rect.top = rect.bottom - h;
    rect.left = rect.right - w;

    return rect;
}

/**
 * Get the process name by a window HWND
 *
 * @param hwnd the hwnd to the window
 * @return the process name. May be empty if not found.
 */
std::wstring getProcessName(HWND hwnd) {
    // Create the output string
    std::wstring processName(MAX_PATH, '\0');
    DWORD dwProcId = 0;

    // Get the process id
    GetWindowThreadProcessId(hwnd, &dwProcId);

    // Open the process
    HANDLE hProc = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, dwProcId);
    if (hProc != nullptr) {
        HMODULE hMod;
        DWORD cbNeeded;

        // Get the process name, if possible
        if (EnumProcessModules(hProc, &hMod, sizeof(void *), &cbNeeded)) {
            GetModuleBaseNameW(hProc, hMod, processName.data(), static_cast<DWORD>(processName.size()));
        }
    }

    // Close the handle to the process
    CloseHandle(hProc);

    // Resize the process name to its actual length
    processName.resize(wcslen(processName.c_str()));
    return processName;
}

using namespace windowUtils;

std::string windowSize::toString() const {
    std::stringstream ss;
    ss << "xPos: " << xPos << ", yPos: " << yPos << ", width: " << width << ", height: " << height;

    return ss.str();
}

// processInfo class ================================================

processInfo::processInfo(const std::wstring &programName) : programName(utils::utf_16_to_utf_8(programName)) {}

std::string processInfo::getProgramName() const {
    return programName;
}

// The windowsProcessInfo class =====================================

class windowsProcessInfo::processHandle {
public:
    explicit processHandle(HWND hwnd) : hwnd(hwnd) {}

    HWND hwnd;
};

windowsProcessInfo::windowsProcessInfo(const std::wstring &programName, const processHandle &handle) : processInfo(
        programName), handle(std::make_shared<processHandle>(handle)) {}

windowSize windowsProcessInfo::getSize() const {
    // If the handle isn't valid, throw an error
    if (!isValid()) {
        throw std::runtime_error("The window handle is not valid anymore");
    }

    // Calculate the window rect
    RECT rect = calculateWindowRect(handle->hwnd);

    // Calculate the positions and size of the window
    const long xPos = rect.left;
    const long yPos = rect.top;
    const long width = rect.right - rect.left;
    const long height = rect.bottom - rect.top;

    // Check if the window is visible
    if (width == 0 || height == 0 || xPos < 0 || yPos < 0) {
        throw std::runtime_error("Could not get the window size");
    }

    // Return the window size
    return windowSize{xPos, yPos, width, height};
}

bool windowsProcessInfo::isValid() const {
    return IsWindow(handle->hwnd) && IsWindowVisible(handle->hwnd);
}

std::string windowsProcessInfo::getWindowName() const {
    // If the handle isn't valid, throw an error
    if (isValid()) {
        // Get the window title
        std::wstring title(GetWindowTextLengthW(handle->hwnd), '\0');
        GetWindowTextW(handle->hwnd, title.data(), (int) title.size() + 1);

        return utils::utf_16_to_utf_8(title);
    } else {
        throw std::runtime_error("The window handle is not valid anymore");
    }
}

unsigned long windowsProcessInfo::getProcessId() const {
    // If the handle isn't valid, throw an error
    if (!isValid()) {
        throw std::runtime_error("The window handle is not valid anymore");
    }

    // Get the process id
    unsigned long winId;
    GetWindowThreadProcessId(handle->hwnd, &winId);

    return winId;
}

// programInfo class ============================

std::wstring programInfo::getProgramName() const {
    return programName;
}

// The windowsProgramInfo class =====================================

class windowsProgramInfo::programHandles {
public:
    explicit programHandles(HWND hwnd) : hwnds() {
        hwnds.push_back(hwnd);
    }

    explicit programHandles(std::vector<HWND> hwnds) : hwnds(std::move(hwnds)) {}

    std::vector<HWND> hwnds;
};

windowsProgramInfo::windowsProgramInfo(const std::wstring &programName, const programHandles &handles) {
    this->programName = programName;
    handle = std::make_shared<programHandles>(handles);
}

windowsProgramInfo::windowsProgramInfo(const std::string &programName) {
    this->programName = utils::utf_8_to_utf_16(programName);
    handle = getHandle(this->programName);
}

windowsProgramInfo::windowsProgramInfo(const std::wstring &programName) {
    this->programName = programName;
    handle = getHandle(programName);
}

process_vector windowsProgramInfo::getProcesses() const {
    // Create the result vector
    process_vector res;
    for (HWND hwnd : handle->hwnds) {
        res.push_back(std::make_unique<windowsProcessInfo>(programName, windowsProcessInfo::processHandle(hwnd)));
    }

    return res;
}

std::shared_ptr<windowsProgramInfo::programHandles> windowsProgramInfo::getHandle(const std::wstring &programName) {
    // The process ids of this program
    std::vector<DWORD> pids;

    // Create a snapshot to this process
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);

    PROCESSENTRY32W entry;
    entry.dwSize = sizeof entry;

    // Get the first process entry
    if (!Process32FirstW(snap, &entry)) {
        throw std::runtime_error("Process32FirstW failed");
    }

    // Find all with the program name associated process ids
    do {
        if (std::wstring(entry.szExeFile) == programName) {
            pids.emplace_back(entry.th32ProcessID);
        }
    } while (Process32NextW(snap, &entry));

    // Close the handle to the snapshot
    CloseHandle(snap);

    // Create the window data as an inner class
    class windowData {
    public:
        // The process ids
        const std::vector<u_long> &pids;
        // The hwnd vector to fill
        std::vector<HWND> hwnds;
    };

    // Enumerate all windows
    windowData wData{pids};
    EnumWindows([](HWND hwnd, LPARAM lParam) -> BOOL {
        // Get the window data
        windowData &data = *reinterpret_cast<windowData *>(lParam);

        // Get the window id
        DWORD winId;
        GetWindowThreadProcessId(hwnd, &winId);

        // Check if pid is in data.pids
        for (DWORD pid : data.pids) {
            if (winId == pid) {
                // Calculate the window rect
                RECT rect = calculateWindowRect(hwnd);

                // Only add this hwnd if the window has a size and the title is not empty
                const int text_len = GetWindowTextLengthW(hwnd);
                HWND parent = GetWindow(hwnd, GW_OWNER);

                // Only continue if the window text is longer than zero and the parent window is null
                if (text_len > 0 && parent == nullptr) {
                    // Calculate the window positions and size
                    long xPos = rect.left;
                    long yPos = rect.top;
                    long width = rect.right - rect.left;
                    long height = rect.bottom - rect.top;

                    // Add the hwnd to the hwnd list if the window is visible
                    if (xPos >= 0 && yPos >= 0 && width > 0 && height > 0) {
                        data.hwnds.push_back(hwnd);
                    } else {
                        // Get the window name
                        std::wstring windowName(text_len + 1, '\0');
                        GetWindowTextW(hwnd, windowName.data(), static_cast<int>(windowName.size()));

                        // Calculate the rect of the window
                        rect = calculateWindowRect(FindWindowW(nullptr, windowName.c_str()));

                        // Calculate the window positions and size
                        xPos = rect.left;
                        yPos = rect.top;
                        width = rect.right - rect.left;
                        height = rect.bottom - rect.top;
                        // Add the hwnd to the hwnd list if the window is visible
                        if (xPos >= 0 && yPos >= 0 && width > 0 && height > 0) {
                            data.hwnds.push_back(hwnd);
                        }
                    }
                }
            }
        }

        // Continue enumerating
        return true;
    }, reinterpret_cast<LPARAM>(&wData));

    // If no hwnds were found, throw an error
    if (!wData.hwnds.empty()) {
        return std::make_shared<programHandles>(wData.hwnds);
    } else {
        throw std::runtime_error("Could not find the specified process");
    }
}

program_vector windowUtils::getAllOpenWindows() {
    // Create the info class as an inner class
    class info_c {
    public:
        std::map<std::wstring, windowsProgramInfo::programHandles> m;
    };

    // Enumerate all windows
    info_c info;
    EnumWindows([](HWND hwnd, LPARAM lParam) -> BOOL {
        info_c &info = *reinterpret_cast<info_c *>(lParam);

        // Get the window title length
        const int text_len = GetWindowTextLengthW(hwnd);

        // Only continue if the window doesn't have a parent and if it has a valid title
        if (GetWindow(hwnd, GW_OWNER) == nullptr && text_len > 0 && IsWindowVisible(hwnd) && IsWindow(hwnd)) {
            // Try to insert a hwnd into the process map
            // Returns false if the search should continue, true if not
            const auto try_insert = [&info](RECT rect, HWND hwnd) -> bool {
                const long xPos = rect.left;
                const long yPos = rect.top;
                const long width = rect.right - rect.left;
                const long height = rect.bottom - rect.top;

                // Get the process name. If the process name is empty, return true
                // to stop searching for the program
                const std::wstring processName = getProcessName(hwnd);
                if (processName.empty()) return true;

                // Add the hwnd to the result map if the window is valid
                if (width > 0 && height > 0 && xPos >= 0 && yPos >= 0) {
                    if (info.m.find(processName) != info.m.end()) {
                        info.m.at(processName).hwnds.push_back(hwnd);
                    } else {
                        info.m.insert_or_assign(processName, windowsProgramInfo::programHandles(hwnd));
                    }

                    // Stop searching
                    return true;
                } else {
                    // Continue searching
                    return false;
                }
            };

            // Get the window rect
            RECT rect = calculateWindowRect(hwnd);

            // Try to insert the hwnd into the result map
            if (!try_insert(rect, hwnd)) {
                // Get the window size by its window name
                std::wstring windowName(text_len + 1, '\0');
                GetWindowTextW(hwnd, windowName.data(), static_cast<int>(windowName.size()));
                rect = calculateWindowRect(FindWindowW(nullptr, windowName.c_str()));

                // Try to insert the hwnd into the result map
                try_insert(rect, hwnd);
            }
        }

        // Continue enumerating processes
        return true;
    }, reinterpret_cast<LPARAM>(&info));

    // Create the result vector
    program_vector res;
    res.reserve(info.m.size());
    for (const auto &p : info.m) {
        res.push_back(std::make_unique<windowsProgramInfo>(p.first, p.second));
    }

    return res;
}
