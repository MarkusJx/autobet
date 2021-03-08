#ifndef AUTOBET_SETTINGS_HPP
#define AUTOBET_SETTINGS_HPP

#include <nlohmann/json.hpp>

#define SETTINGS_FILE_NAME "autobet.config.json"

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
     * Read a setting from the settings file. Throws on error
     *
     * @tparam R the type of the value to read
     * @param key the key of the value
     * @return the read value
     */
    template<class R>
    inline R read(const std::string key) {
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
