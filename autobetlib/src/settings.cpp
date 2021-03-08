#include <fstream>

#include "settings.hpp"
#include "util/utils.hpp"
#include "logger.hpp"

using namespace settings;

nlohmann::json util::readFile() {
    logger::StaticLogger::debug("Reading settings file");
    std::ifstream inFile;
    inFile.open(SETTINGS_FILE_NAME);

    if (!inFile.is_open()) throw std::exception("Could not open the file");
    nlohmann::json res;
    inFile >> res;
    inFile.close();

    logger::StaticLogger::debugStream() << "Read data: " << res.dump();

    return res;
}

void util::writeFile(const nlohmann::json &value) {
    logger::StaticLogger::debugStream() << "Writing data: " << value;
    std::ofstream outFile;
    outFile.open(SETTINGS_FILE_NAME);
    outFile << value;
    outFile.close();
}

void util::log(const std::string &message) {
    logger::StaticLogger::debug(message);
}
