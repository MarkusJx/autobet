#include "variables.hpp"

#include "exposed_methods.hpp"
#include "logger.hpp"

using namespace markusjx::autobet;

const std::string &exposed_methods::get_app_server_key() {
    return variables::pushNotifications()->get_public_key();
}

void exposed_methods::push_notifications_subscribe(const objects::push_notification_subscriber &sub) {
    variables::database()->insert(sub);
}

void exposed_methods::push_notifications_unsubscribe(const objects::push_notification_subscriber &sub) {
    variables::database()->delete_subscriber(sub);
}