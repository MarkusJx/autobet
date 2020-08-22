#include "logger.hpp"

logger::Logger *ptr = nullptr;
bool toFile = false;
bool toConsole = false;

void logger::StaticLogger::setLogger(Logger *_ptr) {
    ptr = _ptr;
}

logger::Logger *logger::StaticLogger::getLogger() {
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