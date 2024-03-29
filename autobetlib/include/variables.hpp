#ifndef AUTOBETLIB_VARIABLES_HPP
#define AUTOBETLIB_VARIABLES_HPP

#include <cstdint>
#include <atomic>

#include "storage/database.hpp"
#include "opencv_link.hpp"
#include "web/push_notifications.hpp"
#include "controls/navigationStrategies.hpp"

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

    // The name of the game executable, e.g. "GTA5.exe"
    static const std::atomic<char *> game_program_name;
    // The name of the game window process, e.g. "Grand Theft Auto V"
    static const std::atomic<char *> game_process_name;

    static void setProgramName(const std::string &name);
    static void setProcessName(const std::string &name);

    // Every location to a horse to bet on.
    // These also double as the upper y-location of the image
    // to crop to extract the odd of the horse
    static const std::array<uint16_t, 6> yLocations;

    static std::atomic<float> multiplierW;
    static std::atomic<float> multiplierH;
    static std::atomic<int32_t> xPos;
    static std::atomic<int32_t> yPos;

    static void setNavigationStrategy(std::shared_ptr<uiNavigationStrategies::navigationStrategy> &&strategy);
    static std::shared_ptr<uiNavigationStrategies::navigationStrategy> navigationStrategy();
    static std::shared_ptr<markusjx::autobet::database> database();
    static std::shared_ptr<markusjx::autobet::push_notifications> pushNotifications();

    /**
     * Check if the game program and process names are set to their default values
     *
     * @return true if the selected game program is GTA5.exe
     */
    static bool isDefaultGameApplication();

    /**
     * Initialize all required static classes
     */
    static void init();

private:
    static std::shared_ptr<uiNavigationStrategies::navigationStrategy> _navigationStrategy;
    static std::shared_ptr<markusjx::autobet::database> _database;
    static std::shared_ptr<markusjx::autobet::push_notifications> _pushNotifications;
};

#endif //AUTOBETLIB_VARIABLES_HPP
