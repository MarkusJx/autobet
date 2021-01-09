#include <fstream>
#include <thread>
#include <chrono>

#include "settings.hpp"
#include "util/utils.hpp"

#include "logger.hpp"

using namespace settings;
using namespace logger;

typedef struct settings_s {
    __int64 buf1 = 0;
    bool debug = false;
    bool log = false;
    bool webServer = true;
    unsigned int time_sleep = 0;
    __int64 buf2 = 0;
} settings_t;

void
settings::save(bool debug, bool log, bool webServer, unsigned int time_sleep) {
    StaticLogger::debug("Saving settings...");
    std::ofstream ofs("autobet.conf", std::ios::out | std::ios::binary);
    if (!ofs.good()) {
        StaticLogger::error("Unable to open settings file. Flags: " + std::to_string(ofs.flags()));
        return;
    }

    settings_t buf;
    buf.debug = debug;
    buf.log = log;
    buf.webServer = webServer;
    buf.time_sleep = time_sleep;

    ofs.write((char *) &buf, sizeof(settings_t));
    if (ofs.fail()) {
        StaticLogger::warning("Settings file stream fail bit was set, this is not good");
    }

    ofs.flush();

    ofs.close();
    if (ofs.is_open()) {
        StaticLogger::error("Unable to close settings file");
    } else {
        StaticLogger::debug("Settings saved.");
    }
}

void settings::load(bool &debug, bool &log, bool &webServer, unsigned int &time_sleep) {
    StaticLogger::debug("Loading settings");
    settings_t buf;

    if (!utils::fileExists("autobet.conf")) {
        StaticLogger::debug("Settings file does not exist.");
        return;
    }

    std::ifstream ifs("autobet.conf", std::ios::in | std::ios::binary);
    if (!ifs.good()) {
        StaticLogger::error("Unable to open settings file. Flags: " + std::to_string(ifs.flags()));
        goto close;
    }

    ifs.read((char *) &buf, sizeof(settings_t));
    if (ifs.fail()) {
        StaticLogger::warning("File stream fail bit was set");
        goto close;
    }

    if (ifs.eof()) {
        StaticLogger::warning("Settings file end has been reached");
        goto close;
    }

    if (buf.buf1 != 0 || buf.buf2 != 0) {
        StaticLogger::warning("Settings buffer is not zero");
        goto close;
    }

    if (buf.time_sleep != 0 && buf.buf1 == 0 && buf.buf2 == 0) {
        debug = buf.debug;
        log = buf.log;
        webServer = buf.webServer;
        time_sleep = buf.time_sleep;
    } else {
        StaticLogger::warning("Settings file not read correctly, deleting it");
        remove("autobet.conf");
    }

    close:
    ifs.close();

    if (ifs.is_open()) {
        StaticLogger::error("Unable to close settings file");
    } else {
        StaticLogger::debug("Settings loaded.");
    }
}
