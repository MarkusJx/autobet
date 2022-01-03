#include "variables.hpp"

#define ASSERT_SMART_PTR_RET(ptr) if (!(ptr)) \
                                throw std::runtime_error("Tried to call " #ptr " but it was not initialized"); \
                            else return ptr

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
// NOTE: This could also be an int32, you would have to bet 11 years to fill that shit up
// Another note: CLion thinks that the word 'shit' is too offensive. Fuck you too.
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

std::shared_ptr<uiNavigationStrategies::navigationStrategy> variables::_navigationStrategy = nullptr;
std::shared_ptr<markusjx::autobet::database> variables::_database = nullptr;
std::shared_ptr<markusjx::autobet::push_notifications> variables::_pushNotifications = nullptr;

bool variables::isDefaultGameApplication() {
    return strcmp("GTA5.exe", game_program_name) == 0 && strcmp("Grand Theft Auto V", game_process_name) == 0;
}

void variables::init() {
    _navigationStrategy = std::make_shared<uiNavigationStrategies::mouseNavigationStrategy>();
    _database = std::make_shared<markusjx::autobet::database>();
    _pushNotifications = std::make_shared<markusjx::autobet::push_notifications>();
}

std::mutex navigationStrategyMtx;

void variables::setNavigationStrategy(std::shared_ptr<uiNavigationStrategies::navigationStrategy> &&strategy) {
    std::unique_lock lock(navigationStrategyMtx);
    _navigationStrategy = std::move(strategy);
}

std::shared_ptr<uiNavigationStrategies::navigationStrategy> variables::navigationStrategy() {
    std::unique_lock lock(navigationStrategyMtx);
    ASSERT_SMART_PTR_RET(_navigationStrategy);
}

std::shared_ptr<markusjx::autobet::database> variables::database() {
    ASSERT_SMART_PTR_RET(_database);
}

std::shared_ptr<markusjx::autobet::push_notifications> variables::pushNotifications() {
    ASSERT_SMART_PTR_RET(_pushNotifications);
}
