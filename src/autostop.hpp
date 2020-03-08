//
// Created by markus on 05/03/2020.
//

#ifndef AUTOBET_AUTOSTOP_HPP
#define AUTOBET_AUTOSTOP_HPP

#include "logger.hpp"

namespace autostop {
    void init(Logger *logger, int *winnings, unsigned int *time_running);

    bool checkStopConditions();
}

void set_autostop_money(int val);

int get_autostop_money();

void set_autostop_time(int val);

int get_autostop_time();

#endif //AUTOBET_AUTOSTOP_HPP
