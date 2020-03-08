//
// Created by markus on 05/03/2020.
//

#include "autostop.hpp"

Logger *logger_a;

int *money;
unsigned int *cur_time;

int autostop_time = -1, autostop_money = -1;

void autostop::init(Logger *logger, int *winnings, unsigned int *time_running) {
    logger_a = logger;

    money = winnings;
    cur_time = time_running;
}

bool autostop::checkStopConditions() {
    if (autostop_time != -1 && autostop_time > *cur_time) {
        autostop_money = -1;
        autostop_time = -1;

        logger_a->Debug("Stopped because an autostop condition was reached: Time");
        return true;
    } else if (autostop_money != -1 && *money > autostop_money) {
        autostop_money = -1;
        autostop_time = -1;

        logger_a->Debug("Stopped because an autostop condition was reached: Money");
        return true;
    } else {
        return false;
    }
}

void set_autostop_money(int val) {
    logger_a->Debug("Set autostop money to " + std::to_string(val));
    autostop_money = val;
}

int get_autostop_money() {
    return autostop_money;
}

void set_autostop_time(int val) {
    logger_a->Debug("Set autostop time to " + std::to_string(val));
    autostop_time = val;
}

int get_autostop_time() {
    return autostop_time;
}
