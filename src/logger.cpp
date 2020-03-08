//
// Created by markus on 27/12/2019.
//

#include <iostream>
#include <cstdio>
#include <ctime>
#include "logger.hpp"

#if defined(__CYGWIN__)
#   include <w32api/corecrt.h>
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

std::string removeSlash(const std::string &str) {
    return str.substr(str.rfind(slash) + 1);
}

/**
 * Gets the current time and date. Source: https://stackoverflow.com/a/10467633
 *
 * @return The current time and date as a string
 */
char *currentDateTime() {
    time_t now = time(nullptr);
    struct tm tm{};
    char *buf = new char[20];
#ifdef LOGGER_WINDOWS
    localtime_s(&tm, &now);
#else
    tm = *localtime(&now);
#endif

    strftime(buf, 20, "%d-%m-%Y %T", &tm);

    return buf;
}

Logger::Logger() {
    _mode = MODE_CONSOLE;
    file = nullptr;

    init(nullptr, nullptr);
}

Logger::Logger(const char *fileName, LoggerMode mode, const char *fileMode) {
    _mode = mode;
    file = nullptr;

    init(fileName, fileMode);
}

void Logger::init(const char *fileName, const char *fileMode) {
    if (_mode == MODE_BOTH || _mode == MODE_FILE) {
#ifdef LOGGER_WINDOWS
        errno_t err = fopen_s(&file, fileName, fileMode);

        if (err) {
            perror("Could not open out.log file!");
            file = nullptr;
        }
#else
        file = fopen("out.log", fileMode);
        if (file == nullptr) {
            std::cerr << "Could not open out.log file!" << std::endl;
        }
#endif
    }
}

void Logger::_debug(const char *_file, int line, const std::string &message) {
    char *_time = nullptr;
    if (_mode != MODE_NONE) {
        _time = currentDateTime();
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH)) {
        fprintf(this->file, "[%s] [%s:%d] [DEBUG] %s\n", _time, _file, line, message.c_str());
    }

    if (_mode == MODE_BOTH || _mode == MODE_CONSOLE) {
        printf("[%s] [%s:%d] [DEBUG] %s\n", _time, _file, line, message.c_str());
    }

    if (_mode != MODE_NONE) {
        delete[] _time;
    }
}

void Logger::_error(const char *_file, int line, const std::string &message) {
    char *_time = nullptr;
    if (_mode != MODE_NONE) {
        _time = currentDateTime();
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH)) {
        fprintf(this->file, "[%s] [%s:%d] [ERROR] %s\n", _time, _file, line, message.c_str());
    }

    if (_mode == MODE_BOTH || _mode == MODE_CONSOLE) {
        fprintf(stderr, "[%s] [%s:%d] [ERROR] %s\n", _time, _file, line, message.c_str());
    }

    if (_mode != MODE_NONE) {
        delete[] _time;
    }
}

void Logger::_warning(const char *_file, int line, const std::string &message) {
    char *_time = nullptr;
    if (_mode != MODE_NONE) {
        _time = currentDateTime();
    }

    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH)) {
        fprintf(this->file, "[%s] [%s:%d] [WARN] %s\n", _time, _file, line, message.c_str());
    }

    if (_mode == MODE_BOTH || _mode == MODE_CONSOLE) {
        fprintf(stderr, "[%s] [%s:%d] [WARN] %s\n", _time, _file, line, message.c_str());
    }

    if (_mode != MODE_NONE) {
        delete[] _time;
    }
}

void Logger::_unimplemented(const char *_file, int line, const char *function, const std::string &message) {
    char *_time = nullptr;
    if (_mode != MODE_NONE) {
        _time = currentDateTime();
    }

    const char *pattern;

    if (!message.empty()) {
        pattern = "[%s] [%s:%d] [WARN_NOT_IMPLEMENTED] Function %s is currently not implemented: %s\n";
    } else {
        pattern = "[%s] [%s:%d] [WARN_NOT_IMPLEMENTED] Function %s is currently not implemented\n";
    }


    if (file != nullptr && (_mode == MODE_FILE || _mode == MODE_BOTH)) {
        fprintf(this->file, pattern, _time, _file, line, function, message.c_str());
    }

    if (_mode == MODE_BOTH || _mode == MODE_CONSOLE) {
        fprintf(stderr, pattern, _time, _file, line, function, message.c_str());
    }

    if (_mode != MODE_NONE) {
        delete[] _time;
    }
}

Logger::~Logger() {
    this->Debug("Closing logger");

    if (file && (_mode == MODE_BOTH || _mode == MODE_FILE)) {
        this->Debug("Closing logger file stream");

        errno_t err = fclose(this->file);
        if (err) {
            perror("Could not close logger file stream!");
        }
    }
}
