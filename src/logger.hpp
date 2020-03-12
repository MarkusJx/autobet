//
// Created by markus on 26/12/2019.
//

#ifndef GTA_ONLINE_AUTOBET_DEV_LOGGER_HPP
#define GTA_ONLINE_AUTOBET_DEV_LOGGER_HPP

#include <string>
#include <sstream>

#define Debug(message) _debug(removeSlash(__FILE__).c_str(), __LINE__, message)
#define Error(message) _error(removeSlash(__FILE__).c_str(), __LINE__, message)
#define Warning(message) _warning(removeSlash(__FILE__).c_str(), __LINE__, message)
#define Unimplemented(...) _unimplemented(removeSlash(__FILE__).c_str(), __LINE__, __FUNCTION__, __VA_ARGS__)

std::string removeSlash(const std::string &str);

enum LoggerMode {
    MODE_FILE = 0,
    MODE_CONSOLE = 1,
    MODE_BOTH = 2,
    MODE_NONE = 3
};

class Logger {
public:
    Logger();

    explicit Logger(const char *fileName, LoggerMode mode = MODE_FILE, const char *fileMode = "at");

    void _debug(const char *_file, int line, const std::string &message);

    void _error(const char *_file, int line, const std::string &message);

    void _warning(const char *_file, int line, const std::string &message);

    void _unimplemented(const char *file, int line, const char *function, const std::string &message = "");

    ~Logger();

private:
    FILE *file;
    LoggerMode _mode;

    void init(const char *fileName, const char *fileMode);
};

#endif //GTA_ONLINE_AUTOBET_DEV_LOGGER_HPP
