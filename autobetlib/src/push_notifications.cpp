#include "push_notifications.hpp"
#include "util/utils.hpp"
#include "variables.hpp"

#include <filesystem>
#include <nlohmann/json.hpp>

#include "logger.hpp"

#define PRIVATE_KEY "\\push_notifications_private.pem"

using namespace markusjx;
namespace fs = std::filesystem;

std::unique_ptr<pusha::key> generate_keys(const fs::path &private_key) {
    std::error_code ec;
    std::unique_ptr<pusha::key> key = std::make_unique<pusha::key>(pusha::key::generate(ec));

    if (ec) {
        throw std::runtime_error("Could not generate the keys: " + ec.message());
    }

    if (!key->export_private_key(private_key)) {
        throw std::runtime_error("Could not export the private key");
    }

    return key;
}

std::unique_ptr<pusha::key> load_keys(const fs::path &private_key) {
    std::error_code ec;
    std::unique_ptr<pusha::key> key = std::make_unique<pusha::key>(private_key, ec);

    if (ec) {
        throw std::runtime_error("Could not import the private key: " + ec.message());
    }

    return key;
}

autobet::push_notifications::push_notifications() {
    const fs::path private_key = utils::get_or_create_documents_folder() + PRIVATE_KEY;

    if (fs::exists(private_key)) {
        logger::StaticLogger::debug("Loading the public and private keys");
        this->key = load_keys(private_key);
    } else {
        logger::StaticLogger::debug("Either the public and/or private key files do not exist, generating new keys...");
        this->key = generate_keys(private_key);
    }

    this->public_key = this->key->export_public_key();
    logger::StaticLogger::debugStream() << "Loaded public key: " << this->public_key;
}

void autobet::push_notifications::send_notification(const std::string &title, const std::string &message) {
    try {
        const auto expiration = static_cast<unsigned int>(time(nullptr) + 12 * 60 * 60);
        const std::vector<objects::push_notification_subscriber> subscribers = variables::database()->get_all_subscribers();

        nlohmann::json json;
        json["title"] = title;
        json["body"] = message;
        const std::string payload = json.dump();
        logger::StaticLogger::debugStream() << "Sending notification with payload: " << payload
                                            << " to " << subscribers.size() << " subscribers";

        for (const auto &sub: subscribers) {
            try {
                pusha::notify::create_and_send_notification(this->get_key(), sub.subscriber, payload, sub.endpoint,
                                                            sub.p256dh, sub.auth, expiration);
            } catch (const std::exception &e) {
                logger::StaticLogger::warningStream() << "Could not send a notification: " << e.what();
                logger::StaticLogger::debug("Could not send/receive the notification request, deleting subscriber");
                variables::database()->delete_subscriber_by_id(sub.id);
            }
        }
    } catch (const std::exception &e) {
        logger::StaticLogger::errorStream() << "Could not send the notifications: " << e.what();
    }
}

const std::string &autobet::push_notifications::get_public_key() const {
    return this->public_key;
}

pusha::key &autobet::push_notifications::get_key() {
    return *key;
}
