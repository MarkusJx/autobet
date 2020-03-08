//
// Created by markus on 16/01/2020.
//
#ifdef AUTOBET_BUILD_UPDATER
#   define CPPHTTPLIB_OPENSSL_SUPPORT
#   define CPPHTTPLIB_RECV_BUFSIZ size_t(131072u)
#   define AUTOBET_INSTALLER_NAME "autobet_installer-NEW.exe"
#   define AUTOBET_SIGNATURE_NAME "autobet_installer.pem"
#   define removeFirstLastChar(s) s.substr(1, s.size() - 2)

#   include <httplib.h>
#   include <json.hpp>
#   include <fstream>
#   include <filesystem>

/*#   if defined(__GNUC__) || defined(__GNUG__) || defined(_MSC_VER) || (defined(__clang__) && __clang_major__ >= 2 && __clang_minor__ >= 8)
#       pragma message("INFO: Building with updater enabled")
#   endif*/
#else
#   define UPDATER_UNIMPLEMENTED() logger_u->Unimplemented("Application was built with updater disabled")
#endif //AUTOBET_BUILD_UPDATER

#define string_contains(s, toFind) s.find(toFind) != std::string::npos

#include "updater.hpp"
#include "verifyFile.hpp"

Logger *logger_u = nullptr;
bool _download = true;

void updater::setLogger(Logger *logger) {
    logger_u = logger;
}

bool updater::updateDownloaded() {
#ifdef AUTOBET_BUILD_UPDATER
    return std::filesystem::exists(AUTOBET_INSTALLER_NAME);
#else
    UPDATER_UNIMPLEMENTED();
    return false;
#endif //AUTOBET_BUILD_UPDATER
}

void updater::deleteUpdate() {
#ifdef AUTOBET_BUILD_UPDATER
    if (updateDownloaded()) {
        std::filesystem::remove(AUTOBET_INSTALLER_NAME);
    }
#else
    UPDATER_UNIMPLEMENTED();
#endif //AUTOBET_BUILD_UPDATER
}

bool updater::prepareUpdate() {
#ifdef AUTOBET_BUILD_UPDATER
    namespace fs = std::filesystem;
    logger_u->Debug("Installing update");

    fs::path p = fs::temp_directory_path().append("autobet");
    if (fs::exists(p)) {
        logger_u->Debug("Temporary folder already exists, deleting it");
        fs::remove_all(p);
    }

    logger_u->Debug("Temporary folder does not exist, creating it");
    if (!fs::create_directory(p)) {
        logger_u->Error("Could not create tmp folder");
    } else {
        logger_u->Debug("Created tmp folder");
    }

    logger_u->Debug("Copying files to tmp folder");

    if (fs::exists("Autobet.exe")) {
        fs::copy_file("Autobet.exe", p.string() + std::string("\\Autobet.exe"));
    } else {
        logger_u->Error("Autobet.exe does not exist. Cannot continue");
        fs::remove_all(p);
        return false;
    }

    if (fs::exists("ai-release.dll")) {
        fs::copy_file("ai-release.dll", p.string() + std::string("\\ai-release.dll"));
    } else if (fs::exists("ai.dll")) {
        fs::copy_file("ai.dll", p.string() + std::string("\\ai.dll"));
    } else {
        logger_u->Error("ai.dll or ai-release.dll do not exist. This can only be achieved by a manual (bad) compile");
        fs::remove_all(p);
        return false;
    }

    if (fs::exists("electron-win32-x64")) {
        fs::copy("electron-win32-x64", p.string() + std::string("\\electron-win32-x64"));
    } else {
        logger_u->Error("electron-win32-x64 does not exist. Cannot continue");
        fs::remove_all(p);
        return false;
    }

    if (fs::exists("libcrypto-1_1-x64.dll")) {
        fs::copy("libcrypto-1_1-x64.dll", p.string() + std::string("\\libcrypto-1_1-x64.dll"));
    } else {
        logger_u->Warning("libcrypto-1_1-x64.dll does not exist. The program may not start without it");
    }

    if (fs::exists("libssl-1_1-x64.dll")) {
        fs::copy("libssl-1_1-x64.dll", p.string() + std::string("\\libssl-1_1-x64.dll"));
    } else {
        logger_u->Warning("libssl-1_1-x64.dll does not exist. The program may not start without it");
    }

    if (fs::exists(AUTOBET_INSTALLER_NAME)) {
        fs::copy(AUTOBET_INSTALLER_NAME, p.string() + std::string("\\").append(AUTOBET_INSTALLER_NAME));
    } else {
        logger_u->Error(std::string(AUTOBET_INSTALLER_NAME).append(" does not exist. Cannot continue"));
        fs::remove_all(p);
        return false;
    }

    logger_u->Debug("Done copying files to tmp folder");

    utils::Application app(p.string() + std::string("\\Autobet.exe"));
    if (!app.start("--runUpdate")) {
        logger_u->Error("Could not start Autobet.exe");
        fs::remove_all(p);
        return false;
    } else {
        return true;
    }
#else
    UPDATER_UNIMPLEMENTED();
    return false;
#endif //AUTOBET_BUILD_UPDATER
}

void updater::installUpdate(char *path) {
#ifdef AUTOBET_BUILD_UPDATER
    if (path) {
        logger_u->Debug("Deleting installer in install dir");
        std::string p(path);
        p.append("\\").append(AUTOBET_INSTALLER_NAME);
        if (std::filesystem::exists(p)) {
            std::filesystem::remove(path);
            logger_u->Debug("Deleted installer");
        } else {
            logger_u->Debug("Could not delete installer");
        }
    }

    utils::Application installer(AUTOBET_INSTALLER_NAME);
    std::string cmd("/VERYSILENT /CURRENTUSER /SUPPRESSMSGBOXES /CLOSEAPPLICATIONS /LOG=\"");
    cmd.append(std::filesystem::current_path().string()).append("\\log.txt\"");

    logger_u->Debug("Starting installer. Waiting for it to finish");

    installer.start(cmd.c_str());
    unsigned short time = 0; // Max time running: 5 minutes
    while (installer.isRunning() && time < 120) {
        std::this_thread::sleep_for(std::chrono::milliseconds(2500));
        time++;
    }

    if (time >= 120) {
        logger_u->Error("Installer did not finish in time. Killing it");
        if (installer.kill()) {
            logger_u->Debug("Successfully killed installer");
        } else {
            logger_u->Error("Could not kill installer");
        }
        return;
    }

    std::ifstream ifs(std::filesystem::current_path().string().append("log.txt"), std::ios::in);
    std::string line;

    bool found = false;
    while (std::getline(ifs, line)) {
        if (string_contains(line, "Creating directory: ") || string_contains(line, "Directory for uninstall files:")) {
            found = true;
            break;
        }
    }

    if (found) {
        line = utils::getLastStringPart(line, ' ');

        utils::Application app(line.append("\\Autobet.exe"));
        if (app.start("--afterUpdate")) {
            logger_u->Debug("Started new version");
        } else {
            logger_u->Warning("Could not start new version");
        }
    }
#else
    UPDATER_UNIMPLEMENTED();
#endif //AUTOBET_BUILD_UPDATER
}

void updater::cleanup() {
#ifdef AUTOBET_BUILD_UPDATER
    namespace fs = std::filesystem;

    logger_u->Debug("Performing after-update cleanup");
    fs::path p = fs::temp_directory_path().append("autobet");
    if (fs::exists(p)) {
        fs::remove_all(p);
        logger_u->Debug("deleted tmp folder");
    } else {
        logger_u->Warning("tmp folder does not exist");
    }
#else
    UPDATER_UNIMPLEMENTED();
#endif //AUTOBET_BUILD_UPDATER
}

void updater::abortDownload() {
#ifdef AUTOBET_BUILD_UPDATER
    _download = false;
    if (std::filesystem::exists(AUTOBET_INSTALLER_NAME)) {
        std::filesystem::remove(AUTOBET_INSTALLER_NAME);
    }
#else
    UPDATER_UNIMPLEMENTED();
#endif //AUTOBET_BUILD_UPDATER
}

bool updater::check(char **version) {
#ifdef AUTOBET_BUILD_UPDATER
    logger_u->Debug("Checking for updates");

    httplib::SSLClient cl("api.github.com");
    cl.set_follow_location(true);
    auto res = cl.Get("/repos/markusjx/gta-online-autobet/tags");
    if (!res || res->status != 200) {
        if (res) {
            logger_u->Error("Could not check for updates. Server responded with: " + std::to_string(res->status));
        } else {
            logger_u->Error("Could not check for updates: Server response was empty");
        }
        return false;
    }

    using json = nlohmann::json;
    json j = json::parse(res->body);
    if (!(string_contains(j[0].dump(), "name"))) {
        logger_u->Error("Could not check for updates: Server returned invalid response");
        return false;
    }

    std::string verString = removeFirstLastChar(j[0]["name"].dump());

    logger_u->Debug("Found version: " + verString);

    Version current_version(verString);
    Version this_version(AUTOBET_CURRENT_VERSION);
    if (current_version > this_version) {
        logger_u->Debug("Found new Version!");
        if (version != nullptr) *version = strdup(verString.c_str());
        return true;
    } else {
        logger_u->Debug("No new Version found");
        if (version != nullptr) *version = strdup(verString.c_str());
        return false;
    }
#else
    UPDATER_UNIMPLEMENTED();
    return false;
#endif //AUTOBET_BUILD_UPDATER
}

bool updater::checkSignature(const std::string &version) {
#ifdef AUTOBET_BUILD_UPDATER
    logger_u->Debug("Downloading installer signature");
    std::ofstream stream(AUTOBET_SIGNATURE_NAME, std::ios::binary);

    if (!stream.is_open()) {
        logger_u->Error("Unable to open file output stream");
        stream.close();
        return false;
    }

    auto deleteSig = [] {
        logger_u->Debug("Deleting signature file");
        if (remove(AUTOBET_SIGNATURE_NAME) != 0) {
            logger_u->Error("Could not delete signature file");
        } else {
            logger_u->Debug("Signature file successfully deleted");
        }
    };

    std::string s;
    bool store = true;

    httplib::SSLClient cli("github.com");
    cli.set_follow_location(true);
    auto res = cli.Get(("/MarkusJx/GTA-Online-Autobet/releases/download/" + version + "/autobet_installer.pem").c_str(),
                       [&](const char *data, uint64_t data_length) {
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
                               if (_download) {
                                   stream.write(data, data_length);
                               } else {
                                   return false;
                               }
                           }
                           return true;
                       });

    stream.flush();
    stream.close();

    if (res && res->body.empty() && res->status == 200) {
        logger_u->Debug("Signature downloaded successfully");
    } else {
        logger_u->Error("Signature download did not complete successfully");
        if (utils::fileExists(AUTOBET_SIGNATURE_NAME)) {
            deleteSig();
        }
        return false;
    }

    bool authentic = fileCrypt::verifySignature(AUTOBET_INSTALLER_NAME,
                                                fileCrypt::getFileContent(AUTOBET_SIGNATURE_NAME));

    if (authentic) {
        logger_u->Debug("File signature matched");
        deleteSig();
        return true;
    } else {
        logger_u->Error("File signature did not match");
        logger_u->Debug("Deleting installer file");
        if (remove(AUTOBET_INSTALLER_NAME) != 0)
            logger_u->Error("Could not delete installer file");
        else
            logger_u->Error("Installer file successfully deleted");

        deleteSig();
        return false;
    }
#else
    UPDATER_UNIMPLEMENTED();
    return false;
#endif //AUTOBET_BUILD_UPDATER
}

void updater::download(const std::string &version) {
#ifdef AUTOBET_BUILD_UPDATER
    logger_u->Debug("Downloading new installer");
    std::ofstream stream(AUTOBET_INSTALLER_NAME, std::ios::binary);

    if (!stream.is_open()) {
        logger_u->Error("Unable to open file output stream");
    }

    std::string s;
    bool store = true;

    httplib::SSLClient cli("github.com");
    cli.set_follow_location(true);
    auto res = cli.Get(("/MarkusJx/GTA-Online-Autobet/releases/download/" + version + "/autobet_installer.exe").c_str(),
                       [&](const char *data, uint64_t data_length) {
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
                               if (_download) {
                                   stream.write(data, data_length);
                               } else {
                                   return false;
                               }
                           }
                           return true;
                       });


    if (res && res->body.empty()) {
        logger_u->Debug("File downloaded successfully");
    } else {
        logger_u->Error("File download did not complete successfully");
    }

    stream.flush();
    stream.close();

    if (stream.is_open()) {
        logger_u->Error("Unable to close file output stream");
    }
#else
    UPDATER_UNIMPLEMENTED();
#endif //AUTOBET_BUILD_UPDATER
}
