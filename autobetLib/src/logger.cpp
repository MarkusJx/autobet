#include "logger.hpp"

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