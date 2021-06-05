/*
* MIT License
* Copyright (c) 2021 MarkusJx
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

#ifndef MARKUSJX_WINDOWUTILS_HPP
#define MARKUSJX_WINDOWUTILS_HPP

#include <string>
#include <memory>
#include <vector>

namespace windowUtils {
    /**
     * A class for storing window positions and sizes
     */
    class windowSize {
    public:
        // The windows x-position
        const long xPos;
        // The window y-position
        const long yPos;
        // The window width
        const long width;
        // The window height
        const long height;

        /**
         * Convert the window size class to a string
         *
         * @return all data members in a string
         */
        [[nodiscard]] std::string toString() const;
    };

/**
 * A class for process information
 */
    class processInfo {
    public:
        explicit processInfo(const std::wstring& programName);

        /**
         * Get the window size
         *
         * @return a windowSize class instance
         */
        [[nodiscard]] virtual windowSize getSize() const = 0;

        /**
         * Check if this process is still valid or running
         *
         * @return true, if the process is valid
         */
        [[nodiscard]] virtual bool isValid() const = 0;

        /**
         * Get the window name
         *
         * @return the window name
         */
        [[nodiscard]] virtual std::string getWindowName() const = 0;

        /**
         * Get the program name
         *
         * @return the program name
         */
        [[nodiscard]] std::string getProgramName() const;

        /**
         * Get the id of this process
         *
         * @return the process id
         */
        [[nodiscard]] virtual unsigned long getProcessId() const = 0;

    private:
        std::string programName;
    };

    /**
     * A class for process information
     */
    class windowsProcessInfo : public processInfo {
    public:
        /**
         * A class for storing the processes' handle
         */
        class processHandle;

        /**
         * Create a processInfo instance
         *
         * @param programName the name of the program
         * @param handle the handle of the process
         */
        explicit windowsProcessInfo(const std::wstring& programName, const processHandle &handle);

        [[nodiscard]] windowSize getSize() const override;

        [[nodiscard]] bool isValid() const override;

        [[nodiscard]] std::string getWindowName() const override;

        [[nodiscard]] unsigned long getProcessId() const override;

    private:
        std::shared_ptr<processHandle> handle;
    };

    // A vector storing process infos
    using process_vector = std::vector<std::unique_ptr<processInfo>>;

    /**
     * A class for getting information about a specific program
     */
    class programInfo {
    public:
        /**
         * Get the processes started by this program
         *
         * @return the processes in a vector
         */
        [[nodiscard]] virtual process_vector getProcesses() const = 0;

        [[nodiscard]] std::wstring getProgramName() const;

    protected:
        std::wstring programName;
    };

    /**
     * A class for getting information about a specific program on windows
     */
    class windowsProgramInfo : public programInfo {
    public:
        /**
         * A class for storing the program handles
         */
        class programHandles;

        /**
         * Create the windowsProgramInfo class with its program name and program handles
         *
         * @param programName the name of the executable
         * @param handles the handles to the processes of the program
         */
        explicit windowsProgramInfo(const std::string &programName, const programHandles &handles);

        /**
         * Get information about a program by its name
         *
         * @param programName the name of the program
         */
        explicit windowsProgramInfo(const std::string &programName);

        /**
         * Get information about a program by its name
         *
         * @param programName the name of the program
         */
        explicit windowsProgramInfo(const std::wstring &programName);

        /**
         * Get all process running by this program
         *
         * @return the process list
         */
        [[nodiscard]] process_vector getProcesses() const override;

    private:
        /**
         * Get the handle vector
         *
         * @param programName the name of the program
         * @return a pointer to the handle vector
         */
        static std::shared_ptr<programHandles> getHandle(const std::wstring &programName);

        // The program handles
        std::shared_ptr<programHandles> handle;
    };

    // A vector storing program infos
    using program_vector = std::vector<std::unique_ptr<programInfo>>;

    /**
     * Get all open windows
     *
     * @return a vector storing all process with open windows
     */
    program_vector getAllOpenWindows();
}

#endif //MARKUSJX_WINDOWUTILS_HPP
