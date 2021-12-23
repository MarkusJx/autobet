#ifndef AUTOBETLIB_PUSH_NOTIFICATIONS_HPP
#define AUTOBETLIB_PUSH_NOTIFICATIONS_HPP

#include <memory>
#include <pusha.hpp>

namespace markusjx::autobet {
    class push_notifications {
    public:
        push_notifications();

        void send_notification(const std::string &title, const std::string &message);
    private:
        std::unique_ptr<pusha::key> key;
    };
}

#endif //AUTOBETLIB_PUSH_NOTIFICATIONS_HPP
