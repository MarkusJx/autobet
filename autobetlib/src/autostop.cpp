#include "autostop.hpp"
#include "variables.hpp"
#include "webui.hpp"
#include "logger.hpp"

int autostop_time = -1;
int autostop_money = -1;

bool autostop::checkStopConditions() {
    if (autostop_time != -1 && autostop_time > static_cast<signed>(variables::time_running)) {
        autostop_money = -1;
        autostop_time = -1;

        logger::StaticLogger::debug("Stopped because an autostop condition was reached: Time");
        return true;
    } else if (autostop_money != -1 && variables::winnings > autostop_money) {
        autostop_money = -1;
        autostop_time = -1;

        logger::StaticLogger::debug("Stopped because an autostop condition was reached: Money");
        return true;
    } else {
        return false;
    }
}

void set_autostop_money(int val) {
    logger::StaticLogger::debugStream() << "Set autostop money to " << val;
    autostop_money = val;
    try {
        webui::setAutostopMoney(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::errorStream() << "Exception thrown: " << e.what();
    }
}

int get_autostop_money() {
    return autostop_money;
}

void set_autostop_time(int val) {
    logger::StaticLogger::debugStream() <<"Set autostop time to " << val;
    autostop_time = val;
    try {
        webui::setAutostopTime(val);
    } catch (const std::exception &e) {
        logger::StaticLogger::errorStream() << "Exception thrown: " << e.what();
    }
}

int get_autostop_time() {
    return autostop_time;
}
