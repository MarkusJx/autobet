//
// Created by markus on 04/03/2020.
//

#ifndef AUTOBET_DEBUG_HPP
#define AUTOBET_DEBUG_HPP

#include <string>

#include "logger.hpp"
#include "utils.hpp"

namespace debug {
    void setLogger(Logger *logger);

    bool init();

    void writeImage(utils::bitmap *bmp);

    void finish();
}

#endif //AUTOBET_DEBUG_HPP
