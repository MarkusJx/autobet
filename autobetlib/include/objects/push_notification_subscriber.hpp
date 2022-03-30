#ifndef AUTOBETLIB_PUSH_NOTIFICATION_SUBSCRIBER_HPP
#define AUTOBETLIB_PUSH_NOTIFICATION_SUBSCRIBER_HPP

#include <string>
#include <nlohmann/json.hpp>

namespace markusjx::autobet::objects {
    class push_notification_subscriber {
    public:
        int64_t id;
        std::string subscriber;
        std::string p256dh;
        std::string auth;
        std::string endpoint;

        [[nodiscard]] std::string to_json() const;

        static push_notification_subscriber from_json(const std::string &json_string);
    };

    void from_json(const nlohmann::json &j, objects::push_notification_subscriber &s);

    void to_json(nlohmann::json &j, const objects::push_notification_subscriber &s);
}

#endif //AUTOBETLIB_PUSH_NOTIFICATION_SUBSCRIBER_HPP
