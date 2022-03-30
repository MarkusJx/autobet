#include <nlohmann/json.hpp>

#include "objects/push_notification_subscriber.hpp"

using namespace markusjx::autobet;

void objects::to_json(nlohmann::json &j, const objects::push_notification_subscriber &s) {
    j = nlohmann::json{
            {"id",         s.id},
            {"subscriber", s.subscriber},
            {"p256dh",    s.p256dh},
            {"auth",       s.auth},
            {"endpoint",   s.endpoint}
    };
}

void objects::from_json(const nlohmann::json &j, objects::push_notification_subscriber &s) {
    s = {0, j["subscriber"], j["p256dh"], j["auth"], j["endpoint"]};
}

std::string objects::push_notification_subscriber::to_json() const {
    nlohmann::json json = *this;
    return json.dump();
}

objects::push_notification_subscriber objects::push_notification_subscriber::from_json(const std::string &json_string) {
    nlohmann::json json = nlohmann::json::parse(json_string);
    return json.get<push_notification_subscriber>();
}