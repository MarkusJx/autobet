//
// Created by markus on 11/03/2020.
//

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

struct settins_s {
    __int64 buf1 = 0;
    bool debug = false;
    bool webServer = true;
    bool controller = false;
    int customBettingPos = -1;
    unsigned int time_sleep = 0;
    unsigned int clicks = 0;
    size_t arrSize = 0;
    __int64 buf2 = 0;
};

void settings::save(bool debug, bool webServer, int customBettingPos, unsigned int time_sleep, unsigned int clicks,
                    bool controller, posConfigArr *arr) {
    std::ofstream ofs("autobet.conf", std::ios::out | std::ios::binary);
    if (!ofs.good()) {
        StaticLogger::error("Unable to open settings file. Flags: " + std::to_string(ofs.flags()));
        return;
    }

    settins_s buf;
    buf.debug = debug;
    buf.webServer = webServer;
    buf.controller = controller;
    buf.customBettingPos = customBettingPos;
    buf.time_sleep = time_sleep;
    buf.clicks = clicks;
    buf.arrSize = arr->size;

    ofs.write((char *) &buf, sizeof(settins_s));
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
    }
}

void settings::load(bool &debug, bool &webServer, int &customBettingPos, unsigned int &time_sleep, unsigned int &clicks,
                    bool &controller, posConfigArr *arr) {
    StaticLogger::debug("Loading winnings from file");
    settins_s buf;

    if (!utils::fileExists("autobet.conf")) {
        StaticLogger::debug("Settings file does not exist.");
        return;
    }

    std::ifstream ifs("autobet.conf", std::ios::in | std::ios::binary);
    if (!ifs.good()) {
        StaticLogger::error("Unable to open settings file. Flags: " + std::to_string(ifs.flags()));
        goto close;
    }

    ifs.read((char *) &buf, sizeof(settins_s));
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
    }
}

void settings::storeConfig(unsigned int time_sleep, unsigned int clicks, posConfigArr *arr) {
    typedef nlohmann::json json;
    json j;
    j["time_sleep"] = time_sleep;
    j["clicks"] = clicks;
    for (int i = 0; i < arr->size; i++) {
        j["posConf"][i]["resolution"] = arr->arr[i].width;
        j["posConf"][i]["value"] = arr->arr[i].x;
    }

    utils::path p;
    utils::getDesktopDirectory(p);
    std::ofstream out(p.toString() + "\\autobet_conf.json", std::ios::out | std::ios::binary);

    out << j.dump(4);

    out.flush();
    out.close();
}

void settings::loadConfig(unsigned int &time_sleep, unsigned int &clicks, posConfigArr *arr) {
    typedef nlohmann::json json;
    utils::path p;

    utils::getDesktopDirectory(p);
    std::ifstream t(p.toString() + "\\autobet_conf.json", std::ios::in | std::ios::binary);
    std::string str;

    t.seekg(0, std::ios::end);
    str.reserve(t.tellg());
    t.seekg(0, std::ios::beg);

    str.assign((std::istreambuf_iterator<char>(t)),
               std::istreambuf_iterator<char>());

    json j = json::parse(str);

    if (j.find("time_sleep") != j.end())
        time_sleep = j["time_sleep"];
    else
        StaticLogger::warning("JSON key 'time_sleep' does not exist");

    if (j.find("clicks") != j.end())
        clicks = j["clicks"];
    else
        StaticLogger::warning("JSON key 'clicks' does not exist");

    StaticLogger::debug("Loaded clicks: " + std::to_string(clicks));
    StaticLogger::debug("Loaded time_sleep: " + std::to_string(time_sleep));

    arr->generate(j["posConf"].size());

    for (int i = 0; i < j["posConf"].size(); i++) {
        if (j["posConf"][i].find("resolution") == j["posConf"][i].end() ||
            j["posConf"][i].find("value") == j["posConf"][i].end()) {
            StaticLogger::warning("JSON 'posConf' key 'resolution' or 'value' does not exist, skipping this set");
            continue;
        }
        arr->arr[i].width = j["posConf"][i]["resolution"];
        arr->arr[i].x = j["posConf"][i]["value"];
        StaticLogger::debug("Loaded resolution " + std::to_string(arr->arr[i].width) + " and corresponding position " +
                            std::to_string(arr->arr[i].x));
    }

    arr->reGen();

    t.close();
}

void settings::configure(std::map<int, int> &map) {
    bool running = true, keyCombListen = true, gameRunning = false;
    bool *kc = &keyCombListen, *r = &running, *gr = &gameRunning;
    auto *ws = (utils::windowSize *) calloc(1, sizeof(utils::windowSize));
    std::map<int, int> *m = &map;

    std::cout << "You have started the configuration assistant for the betting increase button (>)" << std::endl;
    std::cout << "move your mouse over the button and press CTRL+SHIFT+F10" << std::endl;
    std::cout << "you can the edit your game's resolution to add more values" << std::endl;
    std::cout << "Press CTRL+SHIFT+F9 to exit" << std::endl << std::endl;

    std::thread([kc, ws, r, m, gr] {
        while (*kc) {
            if (unsigned(GetKeyState(VK_SHIFT)) & unsigned(0x8000)) {
                if (unsigned(GetKeyState(VK_CONTROL)) & unsigned(0x8000)) {
                    if (unsigned(GetKeyState(VK_F10)) & unsigned(0x8000)) {
                        if (*gr) {
                            POINT p;
                            GetCursorPos(&p);
                            int x = abs(p.x - ws->xPos);
                            std::cout << "Saving x pos: " << x << " and game width: " << ws->width << std::endl;
                            auto it = m->find(ws->width);
                            if (it != m->end()) {
                                it->second = x;
                                std::cout << "A configuration for this width already exists, overwriting it"
                                          << std::endl;
                            } else {
                                m->insert(std::make_pair(ws->width, x));
                            }
                        } else {
                            std::cout << "GTA V is not running, cannot save any cursor position" << std::endl;
                        }
                        std::this_thread::sleep_for(std::chrono::milliseconds(1000));
                    } else if (unsigned(GetKeyState(VK_F9)) & unsigned(0x8000)) {
                        break;
                    }
                }
            }

            // Sleep for 50 milliseconds to reduce cpu usage
            std::this_thread::sleep_for(std::chrono::milliseconds(50));
        }

        // Kill the program if SHIFT+CTRL+F9 is pressed, this on activates if break on the loop is called
        // and keyCombListen is still true, if it is false, the program is about to stop already
        if (*kc) {
            *r = false;
            *kc = false;
            std::cout << "Exiting now. Bye." << std::endl;
            return;
        }
    }).detach();

    if (utils::isProcessRunning("GTA5.exe")) {
        std::cout << "The game is now running" << std::endl;
        gameRunning = true;
    } else {
        std::cout << "The game is not running" << std::endl;
        gameRunning = false;
    }

    while (running) {
        if (utils::isProcessRunning("GTA5.exe")) {
            utils::windowSize w;
            utils::getWindowSize(w);
            if (w.width != ws->width) {
                std::cout << "Window width changed to " << w.width << std::endl;
            }
            ws->width = w.width;
            ws->height = w.height;
            ws->yPos = w.yPos;
            ws->xPos = w.xPos;

            if (!gameRunning)
                std::cout << "The game is now running" << std::endl;
            gameRunning = true;
        } else {
            if (gameRunning)
                std::cout << "The game is not running anymore" << std::endl;
            gameRunning = false;
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(100));
    }
}
