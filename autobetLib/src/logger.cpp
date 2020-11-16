#include "logger.hpp"

static std::unique_ptr<logger::Logger> ptr = nullptr;
static bool toFile = false;
static bool toConsole = false;

void logger::StaticLogger::setLogger(Logger *_ptr) {
    ptr = std::unique_ptr<logger::Logger>(_ptr);
}

std::unique_ptr<logger::Logger> &logger::StaticLogger::getLogger() {
    return ptr;
}

void logger::setLogToConsole(bool val) {
    toConsole = val;
}

bool logger::logToConsole() {
    return toConsole;
}

void logger::setLogToFile(bool val) {
    toFile = val;
}

bool logger::logToFile() {
    return toFile;
}