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

char program_name_buffer[256];
char process_name_buffer[256];
const std::atomic<char *> variables::game_program_name = program_name_buffer;
const std::atomic<char *> variables::game_process_name = process_name_buffer;

void variables::setProgramName(const std::string &name) {
    memset(program_name_buffer, '\0', sizeof(process_name_buffer));
    strcpy_s(program_name_buffer, name.c_str());
}

void variables::setProcessName(const std::string &name) {
    memset(process_name_buffer, '\0', sizeof(process_name_buffer));
    strcpy_s(process_name_buffer, name.c_str());
}

const std::array<uint16_t, 6> variables::yLocations = {452, 616, 778, 940, 1102, 1264};

std::atomic<float> variables::multiplierW = 0;
std::atomic<float> variables::multiplierH = 0;
std::atomic<int32_t> variables::xPos = 0;
std::atomic<int32_t> variables::yPos = 0;

std::shared_ptr<uiNavigationStrategies::navigationStrategy> variables::navigationStrategy = nullptr;
std::shared_ptr<markusjx::autobet::database> variables::database = nullptr;
std::shared_ptr<markusjx::autobet::push_notifications> variables::pushNotifications = nullptr;

bool variables::isDefaultGameApplication() {
    return strcmp("GTA5.exe", game_program_name) == 0 && strcmp("Grand Theft Auto V", game_process_name) == 0;
}

void variables::init() {
    navigationStrategy = std::make_shared<uiNavigationStrategies::mouseNavigationStrategy>();
    database = std::make_shared<markusjx::autobet::database>();
    pushNotifications = std::make_shared<markusjx::autobet::push_notifications>();
}
