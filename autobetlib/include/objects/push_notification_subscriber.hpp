#ifndef AUTOBETLIB_PUSH_NOTIFICATION_SUBSCRIBER_HPP
#define AUTOBETLIB_PUSH_NOTIFICATION_SUBSCRIBER_HPP

#include <string>

namespace markusjx::autobet {
    class push_notification_subscriber {
    public:
        const int64_t id;
        const std::string subscriber;
        const std::string p256pdh;
        const std::string auth;
        const std::string endpoint;
    };
}

#endif //AUTOBETLIB_PUSH_NOTIFICATION_SUBSCRIBER_HPP
