#ifndef AUTOBET_AUTOBETEXCEPTION_HPP
#define AUTOBET_AUTOBETEXCEPTION_HPP

#include <exception>

class autobetException : public std::exception {
public:
    using std::exception::exception;
};

#endif //AUTOBET_AUTOBETEXCEPTION_HPP
