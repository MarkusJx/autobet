#ifndef AUTOBET_DEBUG_HPP
#define AUTOBET_DEBUG_HPP

#include <string>

#include "utils.hpp"

namespace debug {
    bool init();

    void writeImage(utils::bitmap *bmp);

    bool finish();
}

#endif //AUTOBET_DEBUG_HPP
