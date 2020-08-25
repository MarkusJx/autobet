#include <fstream>
#include <json.hpp>
#include <iostream>
#include <Windows.h>
#include <thread>
#include <chrono>

#include "settings.hpp"
#include "utils.hpp"

#include "logger.hpp"

using namespace settings;
using namespace logger;

typedef struct settings_s {
    __int64 buf1 = 0;
    bool debug = false;
    bool log = false;
    bool webServer = true;
    bool controller = false;
    int customBettingPos = -1;
    unsigned int time_sleep = 0;
    unsigned int clicks = 0;
    size_t arrSize = 0;
    __int64 buf2 = 0;
} settings_t;

void
settings::save(bool debug, bool log, bool webServer, int customBettingPos, unsigned int time_sleep, unsigned int clicks,
               bool controller, posConfigArr *arr) {
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
    buf.controller = controller;
    buf.customBettingPos = customBettingPos;
    buf.time_sleep = time_sleep;
    buf.clicks = clicks;
    buf.arrSize = arr->size;

    ofs.write((char *) &buf, sizeof(settings_t));
    if (ofs.fail()) {
        StaticLogger::warning("Settings file stream fail bit was set, this is not good");
    }

    for (size_t i = 0; i < arr->size; i++) {
        ofs.write((char *) &arr->arr[i], sizeof(posConfig));
        if (ofs.fail()) {
            StaticLogger::warning("Settings file stream fail bit was set, this is not good");
            break;
        }
    }

    ofs.flush();

    ofs.close();
    if (ofs.is_open()) {
        StaticLogger::error("Unable to close settings file");
    } else {
        StaticLogger::debug("Settings saved.");
    }
}

void settings::load(bool &debug, bool &log, bool &webServer, int &customBettingPos, unsigned int &time_sleep,
                    unsigned int &clicks, bool &controller, posConfigArr *arr) {
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

    if (buf.time_sleep != 0 && buf.clicks != 0 && buf.buf1 == 0 && buf.buf2 == 0) {
        debug = buf.debug;
        log = buf.log;
        webServer = buf.webServer;
        controller = buf.controller;
        customBettingPos = buf.customBettingPos;
        time_sleep = buf.time_sleep;
        clicks = buf.clicks;
        if (buf.arrSize > 0) {
            arr->generate(buf.arrSize);
            for (int i = 0; i < buf.arrSize; i++) {
                ifs.read((char *) &arr->arr[i], sizeof(posConfig));
            }
        }
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
