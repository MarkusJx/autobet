#include <iostream>
#include <ctime>
#include <memory>
#include <filesystem>

#include "napi_exported.hpp"
#include "util/utils.hpp"

#define LOGGER_NO_UNDEF

#include "logger.hpp"

#ifdef LOGGER_WINDOWS
#   define slash '\\'
#else
#   define slash '/'
#endif

static std::unique_ptr<logger::Logger> ptr = nullptr;
static bool toFile = false;
static bool toConsole = false;

void logger::StaticLogger::setLogger(Logger *_ptr) {
    ptr = std::unique_ptr<logger::Logger>(_ptr);
}

std::unique_ptr<logger::Logger> &logger::StaticLogger::getLogger() noexcept {
    return ptr;
}

void logger::setLogToConsole(bool val) noexcept {
    toConsole = val;
}

bool logger::logToConsole() noexcept {
    return toConsole;
}

void logger::setLogToFile(bool val) noexcept {
    toFile = val;
}

bool logger::logToFile() noexcept {
    return toFile;
}

using namespace logger;

std::string LoggerUtils::currentDateTime() {
    time_t now = time(nullptr);
    struct tm tm{};

    std::string buf;
    buf.resize(LoggerOptions::time_fmt.sizeInBytes);
#ifdef LOGGER_WINDOWS
    localtime_s(&tm, &now);
#else
    tm = *localtime(&now);
#endif
    strftime(buf.data(), LoggerOptions::time_fmt.sizeInBytes, LoggerOptions::time_fmt.format, &tm);

    buf.resize(buf.size() - 1);
    return buf;
}

std::string LoggerUtils::removeSlash(const std::string &str) {
    return str.substr(str.rfind(slash) + 1);
}

// LoggerUtils::LoggerStream class ==================================

LoggerUtils::LoggerStream::LoggerStream(std::function<void(std::string)> callback, LoggerMode mode, bool disabled)
        : _callback(std::move(callback)), _mode(mode), _disabled(disabled) {
    if (mode == LoggerMode::MODE_NONE || disabled) {
        this->setstate(std::ios_base::failbit); // Discard any input
    }
}

LoggerUtils::LoggerStream::~LoggerStream() {
    if (_mode != LoggerMode::MODE_NONE && !_disabled) {
        _callback(this->str());
    }
}

// Logger class =====================================================

Logger::Logger(LoggerMode mode, LogLevel lvl, const char *fileName, const char *fileMode) {
    _mode = mode;
    level = lvl;
    file = nullptr;

    init(fileName, fileMode);
}

void Logger::_debug(const char *_file, int line, const std::string &message) {
    std::string _time;
    if (_mode != LoggerMode::MODE_NONE && level == LogLevel::debug) {
        _time = LoggerUtils::currentDateTime();
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH) && level == LogLevel::debug &&
        logToFile()) {
        fprintf(this->file, "[%s] [%s:%d] [DEBUG] %s\n", _time.c_str(), _file, line, message.c_str());
        fflush(this->file);
    }

    if ((_mode == MODE_BOTH || _mode == MODE_CONSOLE) && level == LogLevel::debug && logToConsole()) {
        std::string s = "[";
        s.append(_time).append("] [").append(_file).append(":").append(std::to_string(line)).append(
                "] [DEBUG] ").append(message).append("\n");
        napi_exported::node_log(s);
    }
}

void Logger::simpleDebug(const std::string &message) {
    std::string _time;
    if (_mode != LoggerMode::MODE_NONE && level == LogLevel::debug) {
        _time = LoggerUtils::currentDateTime();
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH) && level == LogLevel::debug &&
        logToFile()) {
        fprintf(this->file, "[%s] %s\n", _time.c_str(), message.c_str());
        fflush(this->file);
    }

    if ((_mode == MODE_BOTH || _mode == MODE_CONSOLE) && level == LogLevel::debug && logToConsole()) {
        std::string s = "[";
        s.append(_time).append("] ").append(message).append("\n");
        napi_exported::node_log(s);
    }
}

void Logger::_error(const char *_file, int line, const std::string &message) {
    std::string _time;
    if (_mode != MODE_NONE && level != LogLevel::none) {
        _time = LoggerUtils::currentDateTime();
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH) && level != LogLevel::none &&
        logToFile()) {
        fprintf(this->file, "[%s] [%s:%d] [ERROR] %s\n", _time.c_str(), _file, line, message.c_str());
        fflush(this->file);
    }

    if ((_mode == MODE_BOTH || _mode == MODE_CONSOLE) && level != LogLevel::none && logToConsole()) {
        std::string s = "[";
        s.append(_time).append("] [").append(_file).append(":").append(std::to_string(line)).append(
                "] [ERROR] ").append(message).append("\n");
        napi_exported::node_log(s);
    }
}

void Logger::simpleError(const std::string &message) {
    std::string _time;
    if (_mode != MODE_NONE && level != LogLevel::none) {
        _time = LoggerUtils::currentDateTime();
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH) && level != LogLevel::none && logToFile()) {
        fprintf(this->file, "[%s] %s\n", _time.c_str(), message.c_str());
        fflush(this->file);
    }

    if ((_mode == MODE_BOTH || _mode == MODE_CONSOLE) && level != LogLevel::none && logToConsole()) {
        std::string s = "[";
        s.append(_time).append("] ").append(message).append("\n");
        napi_exported::node_log(s);
    }
}

void Logger::_warning(const char *_file, int line, const std::string &message) {
    std::string _time;
    if (_mode != MODE_NONE && (level == LogLevel::debug || level == LogLevel::warning)) {
        _time = LoggerUtils::currentDateTime();
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH) &&
        (level == LogLevel::debug || level == LogLevel::warning) && logToFile()) {
        fprintf(this->file, "[%s] [%s:%d] [WARN] %s\n", _time.c_str(), _file, line, message.c_str());
        fflush(this->file);
    }

    if ((_mode == MODE_BOTH || _mode == MODE_CONSOLE) &&
        (level == LogLevel::debug || level == LogLevel::warning) && logToConsole()) {
        std::string s = "[";
        s.append(_time).append("] [").append(_file).append(":").append(std::to_string(line)).append(
                "] [WARN] ").append(message).append("\n");
        napi_exported::node_log(s);
    }
}

void Logger::_unimplemented(const char *_file, int line, const char *function, const std::string &message) {
    std::string _time;
    if (_mode != MODE_NONE && (level == LogLevel::debug || level == LogLevel::warning)) {
        _time = LoggerUtils::currentDateTime();
    }

    const char *pattern;

    if (!message.empty()) {
        pattern = "[%s] [%s:%d] [WARN_NOT_IMPLEMENTED] Function %s is currently not implemented: %s\n";
    } else {
        pattern = "[%s] [%s:%d] [WARN_NOT_IMPLEMENTED] Function %s is currently not implemented\n";
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH) &&
        (level == LogLevel::debug || level == LogLevel::warning) && logToFile()) {
        fprintf(this->file, pattern, _time.c_str(), _file, line, function, message.c_str());
        fflush(this->file);
    }

    if ((_mode == MODE_BOTH || _mode == MODE_CONSOLE) &&
        (level == LogLevel::debug || level == LogLevel::warning) && logToConsole()) {
        fprintf(stderr, pattern, _time.c_str(), _file, line, function, message.c_str());
    }
}

LoggerUtils::LoggerStream Logger::_debugStream(const char *_file, int line) {
    return LoggerUtils::LoggerStream([this, _file, line](const std::string &buf) {
        this->_debug(_file, line, buf);
    }, _mode, level != LogLevel::debug);
}

LoggerUtils::LoggerStream Logger::_warningStream(const char *_file, int line) {
    return LoggerUtils::LoggerStream([this, _file, line](const std::string &buf) {
        this->_warning(_file, line, buf);
    }, _mode, level != LogLevel::debug && level != LogLevel::warning);
}

LoggerUtils::LoggerStream Logger::_errorStream(const char *_file, int line) {
    return LoggerUtils::LoggerStream([this, _file, line](const std::string &buf) {
        this->_error(_file, line, buf);
    }, _mode, level == LogLevel::none);
}

Logger::~Logger() {
    this->debug("Closing logger");

    if (file && (_mode == MODE_BOTH || _mode == MODE_FILE)) {
        this->debug("Closing logger file stream");

        errno_t err = fclose(this->file);
        if (err) {
            perror("Could not close logger file stream!");
        }
    }
}

void Logger::init(const char *fileName, const char *fileMode) {
    const std::string documents = utils::getDocumentsFolder();
    std::string out_file;
    if (!documents.empty()) {
        const std::string autobet_dir = documents + "\\autobet";
        if (!utils::fileExists(autobet_dir) && !std::filesystem::create_directory(autobet_dir)) {
            out_file = fileName;
        } else {
            out_file = autobet_dir + "\\" + fileName;
        }
    } else {
        out_file = fileName;
    }

    if (_mode == MODE_BOTH || _mode == MODE_FILE) {
#ifdef LOGGER_WINDOWS
        errno_t err = fopen_s(&file, out_file.c_str(), fileMode);

        if (err) {
            perror("Could not open out.log file!");
            file = nullptr;
        } else {
            setvbuf(file, nullptr, _IONBF, 0);
        }
#else
        file = fopen(out_file.c_str(), fileMode);
        if (file == nullptr) {
            std::cerr << "Could not open out.log file!" << std::endl;
        }
#endif
    }
}

// StaticLogger class ===============================================

void StaticLogger::create(LoggerMode mode, LogLevel lvl, const char *fileName, const char *fileMode) {
    if (getLogger()) getLogger().reset();
    setLogger(new Logger(mode, lvl, fileName, fileMode));
}

void StaticLogger::_debug(const char *_file, int line, const std::string &message) {
    if (getLogger())
        getLogger()->_debug(_file, line, message);
}

void StaticLogger::simpleDebug(const std::string &message) {
    if (getLogger())
        getLogger()->simpleDebug(message);
}

void StaticLogger::_error(const char *_file, int line, const std::string &message) {
    if (getLogger())
        getLogger()->_error(_file, line, message);
}

void StaticLogger::simpleError(const std::string &message) {
    if (getLogger())
        getLogger()->simpleError(message);
}

void StaticLogger::_warning(const char *_file, int line, const std::string &message) {
    if (getLogger())
        getLogger()->_warning(_file, line, message);
}

void StaticLogger::_unimplemented(const char *file, int line, const char *function, const std::string &message) {
    if (getLogger())
        getLogger()->_unimplemented(file, line, function, message);
}

LoggerUtils::LoggerStream StaticLogger::_debugStream(const char *_file, int line) {
    if (getLogger())
        return getLogger()->_debugStream(_file, line);
    else
        return LoggerUtils::LoggerStream(nullptr, LoggerMode::MODE_NONE, true);
}

LoggerUtils::LoggerStream StaticLogger::_warningStream(const char *_file, int line) {
    if (getLogger())
        return getLogger()->_warningStream(_file, line);
    else
        return LoggerUtils::LoggerStream(nullptr, LoggerMode::MODE_NONE, true);
}

LoggerUtils::LoggerStream StaticLogger::_errorStream(const char *_file, int line) {
    if (getLogger())
        return getLogger()->_errorStream(_file, line);
    else
        return LoggerUtils::LoggerStream(nullptr, LoggerMode::MODE_NONE, true);
}

void StaticLogger::destroy() {
    getLogger().reset();
}

bool StaticLogger::loggingEnabled() {
    return getLogger().operator bool() && logToFile() && logToConsole();
}
