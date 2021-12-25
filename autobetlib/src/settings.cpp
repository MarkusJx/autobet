#include <fstream>
#include <filesystem>

#include "settings.hpp"
#include "util/utils.hpp"
#include "logger.hpp"

using namespace settings;

#define SETTINGS_FILE_NAME "autobet.config.json"
#define SETTINGS_DIRECTORY "autobet"

/**
 * Get the path to the settings directory
 *
 * @return the path to the settings directory
 */
std::string getSettingsDirectory() {
    std::string filename = utils::getDocumentsFolder();
    if (filename.empty()) throw std::exception("Could not get the documents folder");
    filename.append("\\").append(SETTINGS_DIRECTORY);

    return filename;
}

/**
 * Get the path to the settings file
 *
 * @return the path
 */
std::string getSettingsFile() {
    return getSettingsDirectory().append("\\").append(SETTINGS_FILE_NAME);
}

/**
 * Check if the settings directory exists
 *
 * @return true if it exists
 */
bool settingsDirectoryExists() {
    std::string filename = getSettingsDirectory();

    return utils::fileExists(filename);
}

bool settings::settingsFileExists() {
    std::string filename = getSettingsFile();
    return utils::fileExists(filename);
}

bool settings::has_key(const std::string &key) {
    if (settingsFileExists()) {
        const nlohmann::json json = util::readFile();
        return json.contains(key) && json[key] != nullptr;;
    } else {
        return false;
    }
}

nlohmann::json util::readFile() {
    logger::StaticLogger::debug("Reading settings file");
    std::string filename = getSettingsFile();

    std::ifstream inFile;
    inFile.open(filename);

    if (!inFile.is_open()) throw std::exception("Could not open the file");
    nlohmann::json res;
    inFile >> res;
    inFile.close();

    logger::StaticLogger::debugStream() << "Read data: " << res.dump();

    return res;
}

void util::writeFile(const nlohmann::json &value) {
    logger::StaticLogger::debugStream() << "Writing data: " << value;
    if (!settingsDirectoryExists()) {
        logger::StaticLogger::debug("The settings directory does not exist, creating it");
        if (!std::filesystem::create_directory(getSettingsDirectory())) {
            throw std::exception("Could not create the settings directory");
        }
    }

    std::string filename = getSettingsFile();

    std::ofstream outFile;
    outFile.open(filename);

    if (!outFile.is_open()) throw std::exception("Could not open the file");
    outFile << std::setw(4) << value;
    outFile.close();
}

void util::log(const std::string &message) {
    logger::StaticLogger::debug(message);
}
