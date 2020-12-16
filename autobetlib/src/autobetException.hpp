#ifndef AUTOBET_AUTOBETEXCEPTION_HPP
#define AUTOBET_AUTOBETEXCEPTION_HPP

#include <exception>

/**
 * The autobet exception class
 */
class autobetException : public std::exception {
public:
    /**
     * Create a autobet exception
     *
     * @param msg the error message
     */
    explicit inline autobetException(std::string msg) : msg(std::move(msg)) {}

    /**
     * Get the error message
     *
     * @return the error message
     */
    [[nodiscard]] inline const char *what() const override {
        return msg.c_str();
    }

private:
    const std::string msg;
};

#endif //AUTOBET_AUTOBETEXCEPTION_HPP
