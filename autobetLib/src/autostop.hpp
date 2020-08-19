#ifndef AUTOBET_AUTOSTOP_HPP
#define AUTOBET_AUTOSTOP_HPP

namespace autostop {
    void init(int *winnings, unsigned int *time_running);

    bool checkStopConditions();
}

void set_autostop_money(int val);

int get_autostop_money();

void set_autostop_time(int val);

int get_autostop_time();

#endif //AUTOBET_AUTOSTOP_HPP
