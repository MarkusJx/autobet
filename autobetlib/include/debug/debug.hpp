#ifndef AUTOBET_DEBUG_HPP
#define AUTOBET_DEBUG_HPP

#include <string>
#include <vector>

/**
 * Debugging namespace
 */
namespace debug {
    /**
     * Initialize the debug_full process
     * 
     * @return true, if the initialization was successful
     */
    bool init();

    /**
     * Write an image to the debug zip folder
     * 
     * @param bmp the bitmap to write
     */
    void writeImage(const std::vector<unsigned char> &bmp);

    /**
     * Finish up the debugging
     */
    void finish();

    /**
     * Check the age of the log and delete it if its last write was more than 7 days ago
     *
     * @return true, if the file was deleted
     */
    bool checkLogAge();
}

#endif //AUTOBET_DEBUG_HPP
