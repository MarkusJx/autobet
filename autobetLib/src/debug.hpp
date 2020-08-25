#ifndef AUTOBET_DEBUG_HPP
#define AUTOBET_DEBUG_HPP

#include <string>

#include "utils.hpp"

namespace debug {
    bool init();

    void writeImage(utils::bitmap *bmp);

    bool finish();

    /**
     * Check the age of the log and delete it if its last write was more than 7 days ago
     *
     * @return true, if the file was deleted
     */
    bool checkLogAge();
}

#endif //AUTOBET_DEBUG_HPP
