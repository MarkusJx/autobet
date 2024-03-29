#ifndef AUTOBET_SETTINGS_HPP
#define AUTOBET_SETTINGS_HPP

#include <nlohmann/json.hpp>

#define AUTOBET_SETTINGS_WEB_UI_IP "webUiIp"
#define AUTOBET_SETTINGS_WEB_UI_PORT "webUiPort"
#define AUTOBET_SETTINGS_WEB_UI_WEBSOCKET_PORT "webUiWebsocketPort"
#define AUTOBET_SETTINGS_ENABLE_UPNP "enableUpnp"
#define AUTOBET_SETTINGS_COLLECT_HISTORIC_DATA "collectHistoricData"

/**
 * The settings namespace
 */
namespace settings {
    /**
     * Settings utility functions
     */
    namespace util {
        /**
         * Read the settings file as json
         *
         * @return the parsed json values
         */
        nlohmann::json readFile();

        /**
         * Write to the settings file. Overwrites any existing values
         *
         * @param value the json values to write
         */
        void writeFile(const nlohmann::json &value);

        /**
         * Log a message. Just here since the logger would break any other files
         *
         * @param message the message to log
         */
        void log(const std::string &message);
    }

    /**
     * Check if the settings file exists
     *
     * @return true if the file exists
     */
    bool settingsFileExists();

    bool has_key(const std::string &key);

    /**
     * Read a setting from the settings file. Throws on error
     *
     * @tparam R the type of the value to read
     * @param key the key of the value
     * @return the read value
     */
    template<class R>
    inline R read(const std::string &key) {
        nlohmann::json json = util::readFile();

        return json[key].get<R>();
    }

    /**
     * Write a setting to the settings file
     *
     * @tparam T the type of the value to write
     * @param key the key of the value
     * @param value the value to write
     */
    template<class T>
    inline void write(const std::string key, const T &value) {
        try {
            nlohmann::json json = util::readFile();
            json[key] = value;

            util::writeFile(json);
        } catch (...) {
            util::log("Could not read the settings file, just writing");
            nlohmann::json json;
            json[key] = value;

            util::writeFile(json);
        }
    }
}

#endif //AUTOBET_SETTINGS_HPP
