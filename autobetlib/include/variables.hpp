#ifndef AUTOBETLIB_VARIABLES_HPP
#define AUTOBETLIB_VARIABLES_HPP

#include <cstdint>
#include <atomic>

#include "opencv_link.hpp"

class variables {
public:
    static std::atomic<uint32_t> time_sleep;
    static std::atomic<uint32_t> time_running;
    static std::atomic<bool> debug_full;
    static std::atomic<bool> webServer;
    static std::atomic<bool> keyCombListen;
    static std::atomic<bool> runLoops;
    static std::atomic<bool> running;
    static std::atomic<bool> starting;
    static std::atomic<bool> gtaVRunning;
    static std::atomic<bool> stopping;
    static std::atomic<int> winnings;
    static std::atomic<int64_t> winnings_all;
    static opencv_link::knn knn;
};

#endif //AUTOBETLIB_VARIABLES_HPP
