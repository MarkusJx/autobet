/*
 * MIT License
 *
 * Copyright (c) 2020 MarkusJx
 *
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
#ifndef LOGGER_LOGGER_HPP
#define LOGGER_LOGGER_HPP

#include <string>
#include <functional>
#include <sstream>
#include "main.hpp"

#define debug(message) _debug(::logger::LoggerUtils::removeSlash(__FILE__).c_str(), __LINE__, message)
#define warning(message) _warning(::logger::LoggerUtils::removeSlash(__FILE__).c_str(), __LINE__, message)
#define error(message) _error(::logger::LoggerUtils::removeSlash(__FILE__).c_str(), __LINE__, message)
#define unimplemented(...) _unimplemented(::logger::LoggerUtils::removeSlash(__FILE__).c_str(), __LINE__, __FUNCTION__, __VA_ARGS__)

#define debugStream() _debugStream(::logger::LoggerUtils::removeSlash(__FILE__).c_str(), __LINE__)
#define warningStream() _warningStream(::logger::LoggerUtils::removeSlash(__FILE__).c_str(), __LINE__)
#define errorStream() _errorStream(::logger::LoggerUtils::removeSlash(__FILE__).c_str(), __LINE__)

#if __cplusplus >= 201603L || (defined(_MSVC_LANG) && _MSVC_LANG >= 201603L)
#   define LOGGER_MAYBE_UNUSED [[maybe_unused]]
#else
#   define LOGGER_MAYBE_UNUSED
#endif

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32) && !defined(__CYGWIN__)
#   define printf printf_s
#   define fprintf fprintf_s
#   define slash '\\'
#   define LOGGER_WINDOWS
#else
#   define slash '/'
#   undef LOGGER_WINDOWS
#endif

#ifndef LOGGER_WINDOWS
using errno_t = int;
#endif

namespace logger {
    /**
     * The logger mode. Includes no logging, output to a file, output to console and both console and file output
     */
    enum LoggerMode {
        MODE_FILE = 0,
        MODE_CONSOLE = 1,
        MODE_BOTH = 2,
        MODE_NONE = 3
    };

    /**
     * The log level
     */
    enum LogLevel {
        none = 0,
        debug = 1,
        warning = 2,
        error = 3
    };

    /**
     * A namespace for logging options
     */
    namespace LoggerOptions {
        typedef struct loggerTimeFormat_s {
            const char *format;
            unsigned short sizeInBytes;
        } loggerTimeFormat;

        static loggerTimeFormat time_fmt = {"%d-%m-%Y %T", 20};

        /**
         * Set the time format for the logger
         *
         * @param fmt the format
         */
        LOGGER_MAYBE_UNUSED inline void setTimeFormat(loggerTimeFormat fmt) {
            time_fmt = fmt;
        }
    }

    namespace LoggerUtils {
        /**
        * Gets the current time and date. Source: https://stackoverflow.com/a/10467633
        *
        * @return The current time and date as a string
        */
        std::string currentDateTime();

        /**
         * Remove everything but the file name from a string.
         *
         * @param str the input string
         * @return the file name
         */
        std::string removeSlash(const std::string &str);

        /**
         * A stream for logging
         */
        class LoggerStream : public std::stringstream {
        public:
            explicit LoggerStream(std::function<void(std::string)> callback, LoggerMode mode, bool disabled);

            ~LoggerStream() override;

        private:
            std::function<void(std::string)> _callback;
            LoggerMode _mode;
            bool _disabled;
        };
    }

    /**
     * Set whether to log to file
     * 
     * @param val if set to true, the logger will log to a file
     */
    void setLogToFile(bool val) noexcept;

    /**
     * Check if the logger is logging to a file
     * 
     * @return true, if the logger is logging to file
     */
    bool logToFile() noexcept;

    /**
     * Set whether to log to the fake console
     * 
     * @param val if set to true, the logger will log to the fake console
     */
    void setLogToConsole(bool val) noexcept;

    /**
     * Check if the logger is logging to the fake console
     * 
     * @return true, if the logger is logging to the fake console
     */
    bool logToConsole() noexcept;

    /**
     * The main logger class
     */
    class Logger {
    public:
        /**
         * A logger constructor. Usage:
         *
         * <code>
         *    logger::Logger logger(logger::LoggerMode::MODE_FILE, logger::LogLevel::DEBUG, "out.log", "at");
         * </code>
         *
         * @param mode the logger mode
         * @param lvl the logging level
         * @param fileName the output file name
         * @param fileMode the logger file mode
         */
        explicit Logger(LoggerMode mode = MODE_BOTH, LogLevel lvl = LogLevel::debug,
                        const char *fileName = "autobet.log",
                        const char *fileMode = "at");

        /**
         * Write a debug message.
         * You should use the debug macro. Usage:
         *
         * <code>
         *    logger.debug("Some message");
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @param message the message
         */
        void _debug(const char *_file, int line, const std::string &message);

        /**
         * Just print a debug message with a timestamp
         *
         * @param message the message to log
         */
        void simpleDebug(const std::string &message);

        /**
         * Write an error message.
         * You should use the error macro. Usage:
         *
         * <code>
         *    logger.error("Some error message");
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @param message the message
         */
        void _error(const char *_file, int line, const std::string &message);

        /**
         * Just print a error message with a timestamp
         *
         * @param message the message to log
         */
        void simpleError(const std::string &message);

        /**
         * Write a warning message.
         * You should use the warning macro. Usage:
         *
         * <code>
         *    logger.warning("Some warning message");
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @param message the message
         */
        void _warning(const char *_file, int line, const std::string &message);

        /**
         * Write a message that something is not implemented.
         * You should use the unimplemented macro. Usage:
         *
         * <code>
         *    logger.unimplemented("Some message why this is not implemented");
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @param message the message
         */
        void _unimplemented(const char *_file, int line, const char *function, const std::string &message = "");

        /**
         * Get the debug stream.
         * You should use the debugStream macro. Usage:
         *
         * <code>
         *    logger.debugStream() << "Some message and some hex: " << std::hex << 1234;
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @return the debug stream
         */
        LoggerUtils::LoggerStream _debugStream(const char *_file, int line);

        /**
         * Get the warning stream.
         * You should use the warningStream macro. Usage:
         *
         * <code>
         *    logger.warningStream() << "Some warning message and some hex: " << std::hex << 1234;
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @return the warning stream
         */
        LoggerUtils::LoggerStream _warningStream(const char *_file, int line);

        /**
         * Get the error stream.
         * You should use the errorStream macro. Usage:
         *
         * <code>
         *    logger.errorStream() << "Some error message and some hex: " << std::hex << 1234;
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @return the error stream
         */
        LoggerUtils::LoggerStream _errorStream(const char *_file, int line);

        /**
         * The logger destructor
         */
        ~Logger();

    private:
        FILE *file;
        LoggerMode _mode;
        LogLevel level;

        void init(const char *fileName, const char *fileMode);
    };

    /**
     * A static logger class
     */
    class StaticLogger {
    public:
        /**
         * Create a new instance of the logger. Usage:
         *
         * <code>
         *    logger::StaticLogger::create(logger::LoggerMode::MODE_FILE, logger::LogLevel::DEBUG, "out.log", "at");
         * </code>
         *
         * @param mode the logger mode
         * @param lvl the logging level
         * @param fileName the output file name
         * @param fileMode the logger file mode
         */
        LOGGER_MAYBE_UNUSED static void
        create(LoggerMode mode = LoggerMode::MODE_BOTH, LogLevel lvl = LogLevel::debug,
               const char *fileName = "autobet.log", const char *fileMode = "at");

        /**
         * Write a debug message.
         * You should use the debug macro. Usage:
         *
         * <code>
         *    logger::StaticLogger::debug("Some message");
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @param message the message
         */
        LOGGER_MAYBE_UNUSED static void _debug(const char *_file, int line, const std::string &message);

        /**
         * Just print a debug message with a timestamp
         *
         * @param message the message to log
         */
        static void simpleDebug(const std::string &message);

        /**
         * Write a error message.
         * You should use the error macro. Usage:
         *
         * <code>
         *    logger::StaticLogger::error("Some error message");
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @param message the message
         */
        LOGGER_MAYBE_UNUSED static void _error(const char *_file, int line, const std::string &message);

        /**
         * Just print a error message with a timestamp
         *
         * @param message the message to log
         */
        static void simpleError(const std::string &message);

        /**
         * Write a warning message.
         * You should use the warning macro. Usage:
         *
         * <code>
         *    logger::StaticLogger::warning("Some warning message");
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @param message the message
         */
        LOGGER_MAYBE_UNUSED static void _warning(const char *_file, int line, const std::string &message);

        /**
         * Write a message that something is not implemented.
         * You should use the unimplemented macro. Usage:
         *
         * <code>
         *    logger::StaticLogger::unimplemented("Some message why this is not implemented");
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @param message the message
         */
        LOGGER_MAYBE_UNUSED static void
        _unimplemented(const char *file, int line, const char *function, const std::string &message = "");

        /**
         * Get the debug stream.
         * You should use the debugStream macro. Usage:
         *
         * <code>
         *    logger::StaticLogger::debugStream() << "Some message and some hex: " << std::hex << 1234;
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @return the debug stream
         */
        LOGGER_MAYBE_UNUSED static LoggerUtils::LoggerStream _debugStream(const char *_file, int line);

        /**
         * Get the warning stream.
         * You should use the warningStream macro. Usage:
         *
         * <code>
         *    logger::StaticLogger::warningStream() << "Some warning message and some hex: " << std::hex << 1234;
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @return the warning stream
         */
        LOGGER_MAYBE_UNUSED static LoggerUtils::LoggerStream _warningStream(const char *_file, int line);

        /**
         * Get the error stream.
         * You should use the errorStream macro. Usage:
         *
         * <code>
         *    logger::StaticLogger::errorStream() << "Some error message and some hex: " << std::hex << 1234;
         * </code>
         *
         * @param _file the file name
         * @param line the line number
         * @return the error stream
         */
        LOGGER_MAYBE_UNUSED static LoggerUtils::LoggerStream _errorStream(const char *_file, int line);

        /**
         * Destroy the logger instance
         */
        LOGGER_MAYBE_UNUSED static void destroy();

        static bool loggingEnabled();

    private:
        /**
         * Set the logger
         * 
         * @param l the logger to set
         */
        static void setLogger(Logger *l);

        /**
         * Get the logger unique_ptr
         * 
         * @return a reference to the logger unique_ptr
         */
        static std::unique_ptr<Logger> &getLogger() noexcept;
    };
}

#ifndef LOGGER_NO_UNDEF
#   ifdef LOGGER_WINDOWS
#       undef printf
#       undef fprintf
#       undef LOGGER_WINDOWS
#   endif

#   undef slash
#endif //LOGGER_NO_UNDEF

#endif //LOGGER_LOGGER_HPP