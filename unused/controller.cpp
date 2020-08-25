#include "controller.hpp"

#if defined(AUTOBET_BUILD_UPDATER) && defined(AUTOBET_ENABLE_FULL_DEBUG)
#   define CPPHTTPLIB_OPENSSL_SUPPORT
#   define CPPHTTPLIB_RECV_BUFSIZ size_t(131072u)
#   define string_contains(s, toFind) s.find(toFind) != std::string::npos

#   include <httplib.h>
#   include <json.hpp>
#   include <filesystem>
#   include "zip/zip.h"

#else

#   include <windows.h>

#endif // AUTOBET_BUILD_UPDATER

#include <thread>
#include <vXboxInterface.h>
#include "logger.hpp"

controller::controller::controller() {
    unsigned char nEmpty;

    // Test if bus exists
    if (!isVBusExists()) {
        throw controllerUnavailableException("Virtual Xbox bus does not exist");
    }

    // Get the number of empty slots, fail if not enough slots are available
    if (!GetNumEmptyBusSlots(&nEmpty)) {
        throw controllerUnavailableException("Cannot determine number of empty slots");
    } else if (nEmpty < 1) {
        throw controllerUnavailableException("Not enough empty bus slots available");
    }

    // TODO: log number of empty slots

    bool success = false;

    // Try plugging in any controller
    for (int i = 4 - nEmpty; i < 4; i++) {
        // If the controller doesn't exist, try to plug it in
        if (!isControllerExists(i) && PlugIn(i)) {
            // Check if the controller creation was successful
            if (isControllerExists(i) && isControllerOwned(i)) {
                success = true;
                this->index = i;
                break;
            } else if (!UnPlug(i)) { // Try to unplug the device
                // Try to force unplug
                if (!UnPlugForce(i)) {
                    logger::StaticLogger::_error("controller.cpp", __LINE__, "Could not unplug virtual controller");
                }
            }
        }
    }

    // If the controller could not be plugged in, throw an exception
    if (!success) {
        throw controllerUnavailableException("Could not plug in a virtual controller");
    }

    // Sleep for 50 millis so the device can be used
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
}

bool controller::controller::pressDPadRight() const {
    if (!SetDpadRight(index)) return false;
    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
    if (!SetDpadOff(index)) return false;
    // Sleep some time after releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    return true;
}

bool controller::controller::pressA() const {
    if (!SetBtnA(index, true)) return false;
    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
    if (!SetBtnA(index, false)) return false;
    // Sleep some time after releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    return true;
}

controller::controller::~controller() {
    if (!UnPlug(index)) {
        // Try to force unplug
        if (!UnPlugForce(index)) {
            logger::StaticLogger::_error("controller.cpp", __LINE__, "Could not unplug virtual controller");
        }
    }
}

bool controller::scpVBusInstalled() {
    return isVBusExists();
}

#if defined(AUTOBET_BUILD_UPDATER) && defined(AUTOBET_ENABLE_FULL_DEBUG)

bool downloadScpVBus(std::filesystem::path &out_dir) {
    std::string download_url;
    {
        logger::StaticLogger::debug("Getting latest ScpVBus version");
        httplib::SSLClient vCli("api.github.com");
        auto res = vCli.Get("/repos/shauleiz/vXboxInterface/releases/latest");

        if (res->status != 200) {
            logger::StaticLogger::error(
                    "Could not get latest ScpVBus version, server returned status " + std::to_string(res->status));
            return false;
        }

        nlohmann::json json;
        try {
            json = nlohmann::json::parse(res->body);
        } catch (...) {
            logger::StaticLogger::error("Could not parse the json response sent by the server");
            return false;
        }

        if (json.contains("assets")) {
            bool found = false;
            for (const nlohmann::json &e : json["assets"]) {
                if (e.contains("name") && e["name"] == "ScpVBus-x64.zip") {
                    if (e.contains("browser_download_url")) {
                        download_url = e["browser_download_url"];
                        found = true;
                        break;
                    } else {
                        logger::StaticLogger::error(
                                "The json response received did not have the attribute 'browser_download_url'");
                        return false;
                    }
                }
            }

            if (!found) {
                logger::StaticLogger::error("Could not find the appropriate ScpVBus file");
                return false;
            }
        } else {
            logger::StaticLogger::error("The json data returned by the server did not include 'assets'");
            return false;
        }
    }

    namespace fs = std::filesystem;
    logger::StaticLogger::debug("Creating temp folder");

    fs::path p = fs::temp_directory_path().append("autobet_scpvbus");
    if (fs::exists(p)) {
        logger::StaticLogger::debug("Temporary folder already exists, deleting it");
        fs::remove_all(p);
    }

    logger::StaticLogger::debug("Temporary folder does not exist, creating it");
    if (!fs::create_directory(p)) {
        logger::StaticLogger::error("Could not create tmp folder");
        return false;
    } else {
        logger::StaticLogger::debug("Created tmp folder");
    }

    fs::path scvbus_zip = p;
    scvbus_zip.append("ScpVBus.zip");

    logger::StaticLogger::debug("Downloading ScpVBus");
    std::ofstream stream(scvbus_zip, std::ios::binary);

    if (!stream.is_open()) {
        logger::StaticLogger::error("Unable to open file output stream");
        return false;
    }

    std::string s;
    bool store = true;

    httplib::SSLClient cli("github.com");
    cli.set_follow_location(true);
    auto res = cli.Get(download_url.c_str(), [&](const char *data, uint64_t data_length) {
        if (store) {
            s.append(data, data_length);
            if (string_contains(s, "</body></html>")) {
                int pos = (int) s.find("</body></html>");
                s = s.substr(pos + 14, s.length() - pos - 14);

                if (!s.empty()) {
                    stream.write(s.c_str(), s.length() - pos - 14);
                }
                store = false;
            }
        } else {
            stream.write(data, data_length);
        }
        return true;
    });

    if (res && res->body.empty()) {
        logger::StaticLogger::debug("File downloaded successfully");
    } else {
        logger::StaticLogger::error("File download did not complete successfully");
        fs::remove_all(p);
        return false;
    }

    stream.flush();
    stream.close();

    if (stream.is_open()) {
        logger::StaticLogger::error("Unable to close file output stream");
    }

    auto on_extract_entry = [](const char *filename, void *arg) {
        static int i = 0;
        int n = *(int *) arg;
        logger::StaticLogger::debug(
                "Extracted: " + std::string(filename) + " (" + std::to_string(++i) + " of " + std::to_string(n) + ")");

        return 0;
    };

    out_dir = p;
    out_dir.append("scpvbus");
    if (!fs::create_directories(out_dir)) {
        logger::StaticLogger::error("Could not create the zip output directory");
        return false;
    }

    int arg = 2;
    zip_extract(scvbus_zip.string().c_str(), out_dir.string().c_str(), on_extract_entry, &arg);

    return true;
}

bool controller::downloadAndInstallScpVBus() {
    namespace fs = std::filesystem;
    fs::path out_dir;
    if (!downloadScpVBus(out_dir)) {
        return false;
    }

    fs::path extracted_dir = out_dir;
    extracted_dir.append("ScpVBus-x64");
    if (!fs::exists(extracted_dir)) {
        logger::StaticLogger::error("ScpVBus-x64 folder does not exist");
        return false;
    }

    if (system(("powershell -Command \"Start-Process cmd -Verb RunAs -ArgumentList '/c cd " +
                extracted_dir.string() +
                " && devcon.exe install ScpVBus.inf Root\\ScpVBus'\"").c_str()) != 0) {
        logger::StaticLogger::error("Could not run powershell");
        return false;
    }

    std::this_thread::sleep_for(std::chrono::seconds(5));

    return ::controller::scpVBusInstalled();
}

bool controller::downloadAndUninstallScpVBus() {
    namespace fs = std::filesystem;
    fs::path out_dir;
    if (!downloadScpVBus(out_dir)) {
        return false;
    }

    fs::path extracted_dir = out_dir;
    extracted_dir.append("ScpVBus-x64");
    if (!fs::exists(extracted_dir)) {
        logger::StaticLogger::error("ScpVBus-x64 folder does not exist");
        return false;
    }

    logger::StaticLogger::debug("powershell -Command \"Start-Process cmd -Verb RunAs -ArgumentList '/c cd " +
                                extracted_dir.string() +
                                " && devcon.exe install ScpVBus.inf Root\\ScpVBus && PAUSE'\"");

    if (system(("powershell -Command \"Start-Process cmd -Verb RunAs -ArgumentList '/c cd " +
                extracted_dir.string() +
                " && devcon.exe remove Root\\ScpVBus'\"").c_str()) != 0) {
        logger::StaticLogger::error("Could not run powershell");
        return false;
    }

    std::this_thread::sleep_for(std::chrono::seconds(5));

    return !::controller::scpVBusInstalled();
}

#endif //AUTOBET_BUILD_UPDATER