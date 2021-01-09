#ifndef AUTOBET_WEBUI_HPP
#define AUTOBET_WEBUI_HPP

#include <functional>
#include <string>

namespace webui {
    void setGtaRunning(bool);

    void setWinnings(int);

    void setWinningsAll(int64_t);

    void setRacesWon(int);

    void setRacesLost(int);

    void setStarted();

    void setStopped();

    void setStopping();

    void setStarting();

    void setAutostopMoney(int);

    void setAutostopTime(int);

    void set_js_start_script(std::function<void()>);

    void set_js_stop_script(std::function<void()>);

    void set_get_races_won(std::function<int()>);

    void set_get_races_lost(std::function<int()>);

    void set_get_all_winnings(std::function<int()>);

    void set_get_current_winnings(std::function<int()>);

    void set_get_time(std::function<int()>);

    void set_get_gta_running(std::function<bool()>);

    void set_get_running(std::function<int()>);

    bool initialized();

    bool running();

    bool startWebUi(const std::string &ip);

    bool reset();
}

#endif //AUTOBET_WEBUI_HPP
