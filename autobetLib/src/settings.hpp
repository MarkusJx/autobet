#ifndef AUTOBET_SETTINGS_HPP
#define AUTOBET_SETTINGS_HPP

namespace settings {
    void save(bool debug, bool log, bool webServer, unsigned int time_sleep);

    void load(bool &debug, bool &log, bool &webServer, unsigned int &time_sleep);
}

#endif //AUTOBET_SETTINGS_HPP
