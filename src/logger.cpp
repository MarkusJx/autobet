#include "logger.hpp"

logger::Logger *ptr;

void logger::StaticLogger::setLogger(Logger *_ptr) {
    ptr = _ptr;
}

logger::Logger * logger::StaticLogger::getLogger() {
    return ptr;
}