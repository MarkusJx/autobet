#include <thread>

#include "controls/navigationStrategies.hpp"
#include "util/utils.hpp"
#include "variables.hpp"
#include "settings.hpp"
#include "logger.hpp"

using namespace logger;
using namespace uiNavigationStrategies;

/**
 * Sleep for some time. Just an alias for
 * std::this_thread::sleep_for(std::chrono::milliseconds())
 *
 * @param millis the number of milliseconds to sleep
 */
void sleepMs(long long millis) {
    std::this_thread::sleep_for(std::chrono::milliseconds(millis));
}

std::shared_ptr<navigationStrategy> navigationStrategy::fromName(const std::string &name) {
    if (name == "controller") {
        return std::make_shared<controllerNavigationStrategy>();
    } else if (name == "mouse") {
        return std::make_shared<mouseNavigationStrategy>();
    } else {
        throw std::exception("Invalid name supplied");
    }
}

navigationStrategy::navigationStrategy() noexcept: click_sleep(100), afterClick_sleep(100) {}

void navigationStrategy::firstBet() const {}

int navigationStrategy::getClickSleep() const {
    return this->click_sleep;
}

int navigationStrategy::getAfterClickSleep() const {
    return this->afterClick_sleep;
}

/**
 * Emulate a mouse left click
 *
 * @param x the x-coordinate of the mouse pointer
 * @param y the y-coordinate of the mouse pointer
 * @param sleep the time to sleep between each action
 * @param move if the mouse should be moved
 */
void leftClick(unsigned int x, unsigned int y, int sleep, bool move = true) {
    // Only click if the program is running and not trying to stop or the user paused the betting
    // so the mouse is not moved while the user is using it
    if (variables::runLoops) {
        // Apply the multipliers to the x and y coords so they fit to any window size
        // because the built-in values are for a 1440p config
        x = (int) round((float) x * variables::multiplierW) + variables::xPos;
        y = (int) round((float) y * variables::multiplierH) + variables::yPos;
        if (!utils::leftClick((int) x, (int) y, sleep, move)) {
            StaticLogger::error("utils::leftClick returned abnormal signal");
        }
    } else {
        StaticLogger::debug("Should click now but the program is about to stop, doing nothing");
    }
}

const int mouseNavigationStrategy::click_sleep_default = 100;

const int mouseNavigationStrategy::afterClick_sleep_default = 100;

mouseNavigationStrategy::mouseNavigationStrategy() noexcept {
    try {
        this->click_sleep = settings::read<int>("mouseClickSleep");
    } catch (...) {
        this->click_sleep = click_sleep_default;
    }

    try {
        this->afterClick_sleep = settings::read<int>("mouseAfterClickSleep");
    } catch (...) {
        this->afterClick_sleep = afterClick_sleep_default;
    }
};

void mouseNavigationStrategy::placeBet(short y) const {
    StaticLogger::debug("Placing bet");
    leftClick(634, variables::yLocations[y], click_sleep);
    sleepMs(afterClick_sleep);

    // 25/08/2020: Today I found out, you could just press tab to place a max bet. Now, that I have invested
    // many hours into setting positions for the 'increase bet' button, this is not very nice. I've even used
    // vXbox to simulate a xBox controller, which is now completely useless. I will not include this fact in any
    // changelog or commit message, this is the only place where anyone can find this shit. If you just found it:
    // good for you, keep it a secret, I don't want anyone to know how dumb I really am. Have a nice day.
    // I am definitely not having a nice day at this point. F*ck.
    if (!utils::pressTab(click_sleep)) {
        StaticLogger::error("Could not press the tab key");
    }
    sleepMs(afterClick_sleep);

    leftClick(1765, 1050, click_sleep);
    sleepMs(afterClick_sleep);
}

void mouseNavigationStrategy::reset() const {
    leftClick(1286, 1304, click_sleep);
    sleepMs(afterClick_sleep);
    leftClick(1905, 1187, click_sleep);
    sleepMs(afterClick_sleep);
}

void mouseNavigationStrategy::skipBet() const {
    StaticLogger::debug("Should not bet on this one, skipping...");
    leftClick(633, 448, click_sleep);
    sleepMs(afterClick_sleep);

    // Sleep between clicks as the game cannot accept so many clicks in quick succession
    // Also, this helps making our clicks seem more human.
    // Just so we going the safer route as of not getting banned.
    // Rockstar would probably not ban anyone for using this,
    // since they are incompetent as fuck, despite having billions of dollars.
    leftClick(1720, 1036, click_sleep);
    sleepMs(afterClick_sleep);
}

std::string mouseNavigationStrategy::getName() const {
    return "mouse";
}

void mouseNavigationStrategy::setClickSleep(int time) {
    this->click_sleep = time;
    settings::write("mouseClickSleep", time);
}

void mouseNavigationStrategy::setAfterClickSleep(int time) {
    this->afterClick_sleep = time;
    settings::write("mouseAfterClickSleep", time);
}

// controllerNavigationStrategy class ===============================
// This was mainly created to support streaming from an xbox,
// requested by github user Max-ES. This feature was made in
// collaboration with them as there was no way for me to test
// this feature, so thank you for your time and effort to make
// this possible.

// The number of clicks required for the controller.
// As we start from the last horse, we'll need 0 clicks
// to get to horse 6, one click to get to horse 5...
// So we can get the clicks using controllerClicks[0]
// to get the amount of clicks needed to get to the first horse.
const std::array<uint16_t, 6> controllerNavigationStrategy::controllerClicks = {5, 4, 3, 2, 1, 0};

const int controllerNavigationStrategy::afterClick_sleep_default = 350;

const int controllerNavigationStrategy::click_sleep_default = 50;

// NOTE: This must not be noexcept, as the controller impl may throw
controllerNavigationStrategy::controllerNavigationStrategy() : impl(nullptr) {
    try {
        this->click_sleep = settings::read<int>("controllerClickSleep");
    } catch (...) {
        this->click_sleep = click_sleep_default;
    }
    this->impl = controller::GameController(this->click_sleep);

    try {
        this->afterClick_sleep = settings::read<int>("controllerAfterClickSleep");
    } catch (...) {
        this->afterClick_sleep = afterClick_sleep_default;
    }
}

void controllerNavigationStrategy::placeBet(short y) const {
    // Get to the last horse
    impl.pressDPadDown();
    sleepMs(afterClick_sleep);
    impl.pressDPadLeft();
    sleepMs(afterClick_sleep);

    // Move up to the horse to bet on
    for (uint16_t i = 0; i < controllerClicks[y]; i++) {
        impl.pressDPadUp();
        sleepMs(afterClick_sleep);
    }

    // Select it. Twice.
    impl.pressA();
    sleepMs(afterClick_sleep);

    // Go to the 'increase bet' button.
    // This is needed to ensure subsequent
    // steps always produce the same result.
    for (int i = 0; i < 3; i++) {
        impl.pressDPadRight();
        sleepMs(afterClick_sleep);
    }

    // Set the max bet using Y, go down to the
    // 'place bet' button and place the bet
    impl.pressY();
    sleepMs(afterClick_sleep);
    impl.pressDPadDown();
    sleepMs(afterClick_sleep);
    impl.pressA();
    sleepMs(afterClick_sleep);
}

void controllerNavigationStrategy::reset() const {
    // Press 'B' to return to the main screen;
    // Press the right d-pad to go to the bet button;
    // Press a to confirm the choice.
    impl.pressB();
    sleepMs(afterClick_sleep);
    impl.pressDPadRight();
    sleepMs(afterClick_sleep);
    impl.pressDPadRight();
    sleepMs(afterClick_sleep);
    impl.pressA();
    sleepMs(afterClick_sleep);
}

void controllerNavigationStrategy::skipBet() const {
    // Press d-pad left 2 times to select the last horse,
    // press A to actually select it, press d-pad right
    // three times to move over the 'increase bet' button,
    // press d-pad down to select the 'place bet' button
    // and confirm the choice using the A button
    impl.pressDPadLeft();
    sleepMs(afterClick_sleep);
    impl.pressDPadLeft();
    sleepMs(afterClick_sleep);
    impl.pressA();
    sleepMs(afterClick_sleep);

    for (int i = 0; i < 3; i++) {
        impl.pressDPadRight();
        sleepMs(afterClick_sleep);
    }

    impl.pressDPadDown();
    sleepMs(afterClick_sleep);
    impl.pressA();
    sleepMs(afterClick_sleep);
}

void controllerNavigationStrategy::firstBet() const {
    // Run reset once
    reset();
}

std::string controllerNavigationStrategy::getName() const {
    return "controller";
}

void controllerNavigationStrategy::setClickSleep(int time) {
    this->click_sleep = time;
    this->impl.click_sleep = time;
    settings::write("controllerClickSleep", time);
}

void controllerNavigationStrategy::setAfterClickSleep(int time) {
    this->afterClick_sleep = time;
    settings::write("controllerAfterClickSleep", time);
}