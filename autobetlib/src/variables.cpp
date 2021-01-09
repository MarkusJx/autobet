#include "variables.hpp"

std::atomic<uint32_t> variables::time_sleep = 36;
std::atomic<uint32_t> variables::time_running = 0;
std::atomic<bool> variables::debug_full = false;
std::atomic<bool> variables::webServer = true;
std::atomic<bool> variables::keyCombListen = false;
std::atomic<bool> variables::runLoops = false;
std::atomic<bool> variables::running = false;
std::atomic<bool> variables::starting = false;
std::atomic<bool> variables::gtaVRunning = false;
std::atomic<bool> variables::stopping = false;
std::atomic<int> variables::winnings = 0;
// NOTE: This could also be a int32, you would have to bet 11 years to fill that shit up
std::atomic<int64_t> variables::winnings_all = 0L;
opencv_link::knn variables::knn = nullptr;