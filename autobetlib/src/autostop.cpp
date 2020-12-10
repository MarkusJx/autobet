#include "autostop.hpp"
#include "logger.hpp"

int *money;
unsigned int *cur_time;

int autostop_time = -1;
int autostop_money = -1;

std::function<void(int)> fn_initializer = nullptr;
std::function<void(int)> &webSetAutostopMoneyF = fn_initializer;
std::function<void(int)> &webSetAutostopTimeF = fn_initializer;

void autostop::init(int *winnings, unsigned int *time_running, std::function<void(int)> &webSetAutostopMoney, std::function<void(int)> &webSetAutostopTime) {
    money = winnings;
    cur_time = time_running;

    webSetAutostopMoneyF = webSetAutostopMoney;
    webSetAutostopTimeF = webSetAutostopMoney;
}

bool autostop::checkStopConditions() {
    if (autostop_time != -1 && autostop_time > *cur_time) {
        autostop_money = -1;
        autostop_time = -1;

        logger::StaticLogger::debug("Stopped because an autostop condition was reached: Time");
        return true;
    } else if (autostop_money != -1 && *money > autostop_money) {
        autostop_money = -1;
        autostop_time = -1;

        logger::StaticLogger::debug("Stopped because an autostop condition was reached: Money");
        return true;
    } else {
        return false;
    }
}

void set_autostop_money(int val) {
    logger::StaticLogger::debug("Set autostop money to " + std::to_string(val));
    autostop_money = val;
    if (webSetAutostopMoneyF) webSetAutostopMoneyF(val);
}

int get_autostop_money() {
    return autostop_money;
}

void set_autostop_time(int val) {
    logger::StaticLogger::debug("Set autostop time to " + std::to_string(val));
    autostop_time = val;
    if (webSetAutostopTimeF) webSetAutostopTimeF(val);
}

int get_autostop_time() {
    return autostop_time;
}
