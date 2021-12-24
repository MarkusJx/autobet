#ifndef AUTOBETLIB_EXPOSED_METHODS_HPP
#define AUTOBETLIB_EXPOSED_METHODS_HPP

#include <string>
#include "objects/push_notification_subscriber.hpp"

namespace markusjx::autobet::exposed_methods {
    const std::string &get_app_server_key();

    void push_notifications_subscribe(const markusjx::autobet::objects::push_notification_subscriber &sub);
}

#endif //AUTOBETLIB_EXPOSED_METHODS_HPP
