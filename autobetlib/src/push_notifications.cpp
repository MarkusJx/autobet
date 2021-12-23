#include "push_notifications.hpp"
#include "util/utils.hpp"
#include "variables.hpp"

#include <filesystem>
#include <nlohmann/json.hpp>

#include "logger.hpp"

#define PRIVATE_KEY "\\push_notifications_private.pem"
//#define PUBLIC_KEY "\\push_notifications_public.pem"

using namespace markusjx;
namespace fs = std::filesystem;

std::unique_ptr<pusha::key> generate_keys(const fs::path &private_key/*, const fs::path &public_key*/) {
    std::error_code ec;
    pusha::key key = pusha::key::generate(ec);

    if (ec) {
        throw std::runtime_error("Could not generate the keys: " + ec.message());
    }

    if (!key.export_private_key(private_key)) {
        throw std::runtime_error("Could not export the private key");
    }/* else if (!key.export_public_key(public_key)) {
        throw std::runtime_error("Could not export the public key");
    }*/

    return std::make_unique<pusha::key>(std::move(key));
}

std::unique_ptr<pusha::key> load_keys(const fs::path &private_key/*, const fs::path &public_key*/) {
    std::error_code ec;
    pusha::key key(private_key, ec);

    if (ec) {
        throw std::runtime_error("Could not import the private key: " + ec.message());
    }

    return std::make_unique<pusha::key>(std::move(key));
}

autobet::push_notifications::push_notifications() {
    const fs::path private_key = utils::get_or_create_documents_folder() + PRIVATE_KEY;
    //const fs::path public_key = utils::get_or_create_documents_folder() + PUBLIC_KEY;

    if (!fs::exists(private_key)/* || !fs::exists(public_key)*/) {
        this->key = std::move(generate_keys(private_key));
    } else {
        this->key = std::move(load_keys(private_key));
    }
}

void autobet::push_notifications::send_notification(const std::string &title, const std::string &message) {
    try {
        const auto expiration = static_cast<unsigned int>(time(nullptr) + 12 * 60 * 60);
        const std::vector<push_notification_subscriber> subscribers = variables::database->get_all_subscribers();

        nlohmann::json json;
        json["title"] = title;
        json["data"] = message;
        const std::string payload = json.dump();
        logger::StaticLogger::debugStream() << "Sending notification with payload: " << payload;

        for (const auto &sub: subscribers) {
            pusha::notify notify(*key, sub.subscriber);
            pusha_http_request req;
            int err = notify.make(req, sub.endpoint, sub.p256pdh, sub.auth, expiration, 60, payload.c_str(),
                                  payload.size());

            if (err) {
                std::error_code ec = make_error_code((pusha::errc) err);
                logger::StaticLogger::warningStream() << "Could not send a notification: " << ec.message();
                if (err == PUSHA_ERROR_MAKE_HTTP_REQUEST || err == PUSHA_ERROR_SSL_CONNECT ||
                    err == PUSHA_ERROR_SSL_RECEIVE || err == PUSHA_ERROR_SSL_SEND) {
                    logger::StaticLogger::debug("Could not send/receive the notification request, deleting subscriber");
                    variables::database->delete_subscriber_by_id(sub.id);
                }
            }

            free_http_request(&req);
        }
    } catch (const std::exception &e) {
        logger::StaticLogger::errorStream() << "Could not send the notifications: " << e.what();
    }
}
