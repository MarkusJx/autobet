#include <thread>

#include "controls/navigationStrategies.hpp"
#include "util/utils.hpp"
#include "variables.hpp"
#include "logger.hpp"

using namespace logger;
using namespace uiNavigationStrategies;

navigationStrategy::navigationStrategy() noexcept = default;

void navigationStrategy::firstBet() const {}

/**
 * Emulate a mouse left click
 *
 * @param x the x-coordinate of the mouse pointer
 * @param y the y-coordinate of the mouse pointer
 * @param move if the mouse should be moved
 */
void leftClick(unsigned int x, unsigned int y, bool move = true) {
    // Only click if the program is running and not trying to stop or the user paused the betting
    // so the mouse is not moved while the user is using it
    if (variables::runLoops) {
        // Apply the multipliers to the x and y coords so they fit to any window size
        // because the built-in values are for a 1440p config
        x = (int) round((float) x * variables::multiplierW) + variables::xPos;
        y = (int) round((float) y * variables::multiplierH) + variables::yPos;
        if (!utils::leftClick((int) x, (int) y, move)) {
            StaticLogger::error("utils::leftClick returned abnormal signal");
        }
    } else {
        StaticLogger::debug("Should click now but the program is about to stop, doing nothing");
    }
}

mouseNavigationStrategy::mouseNavigationStrategy() noexcept = default;

void mouseNavigationStrategy::placeBet(short y) const {
    StaticLogger::debug("Placing bet");
    leftClick(634, variables::yLocations[y]);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    // 25/08/2020: Today I found out, you could just press tab to place a max bet. Now, that I have invested
    // many hours into setting positions for the 'increase bet' button, this is not very nice. I've even used
    // vXbox to simulate a xBox controller, which is now completely useless. I will not include this fact in any
    // changelog or commit message, this is the only place where anyone can find this shit. If you just found it:
    // good for you, keep it a secret, I don't want anyone to know how dumb I really am. Have a nice day.
    // I am definitely not having a nice day at this point. F*ck.
    if (!utils::pressTab()) {
        StaticLogger::error("Could not press the tab key");
    }

    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(1765, 1050);
}

void mouseNavigationStrategy::reset() const {
    leftClick(1286, 1304);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(1905, 1187);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
}

void mouseNavigationStrategy::skipBet() const {
    StaticLogger::debug("Should not bet on this one, skipping...");
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(633, 448);

    // Sleep between clicks as the game cannot accept so many clicks in quick succession
    // Also, this helps making our clicks seem more human.
    // Just so we going the safer route as of not getting banned.
    // Rockstar would probably not ban anyone for using this,
    // since they are incompetent as fuck, despite having billions of dollars.
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    leftClick(1720, 1036);
}

// The number of clicks required for the controller.
// As we start from the last horse, we'll need 0 clicks
// to get to horse 6, one click to get to horse 5...
// So we can get the clicks using controllerClicks[0]
// to get the amount of clicks needed to get to the first horse.
const uint16_t controllerNavigationStrategy::controllerClicks[6] = {5, 4, 3, 2, 1, 0};

// NOTE: This must not be noexcept, as the controller impl may throw
controllerNavigationStrategy::controllerNavigationStrategy() = default;

void controllerNavigationStrategy::placeBet(short y) const {
    // Get to the last horse
    impl.pressDPadDown();
    impl.pressDPadLeft();

    // Move up to the horse to bet on
    for (uint16_t i = 0; i < controllerClicks[y]; i++) {
        impl.pressDPadUp();
    }

    // Select it. Twice.
    impl.pressA();
    impl.pressA();

    // Go to the 'increase bet' button.
    // This is needed to ensure subsequent
    // steps always produce the same result.
    for (int i = 0; i < 3; i++) impl.pressDPadRight();

    // Set the max bet using Y, go down to the
    // 'place bet' button and place the bet
    impl.pressY();
    impl.pressDPadDown();
    impl.pressA();
    // For some reason, we have to press 'A' twice
    impl.pressA();
}

void controllerNavigationStrategy::reset() const {
    // Press 'B' to return to the main screen;
    // Press the right d-pad to go to the bet button;
    // Press a to confirm the choice.
    impl.pressB();
    impl.pressDPadRight();
    impl.pressDPadRight();
    impl.pressA();
    impl.pressA();
}

void controllerNavigationStrategy::skipBet() const {
    // Press a to select the last horse;
    // Press d-pad right to select the 'cancel' button;
    // Press d-pad up to select the 'place bet' button;
    // Press 'A' to confirm the choice.
    impl.pressA();
    impl.pressA();
    for (int i = 0; i < 4; i++) impl.pressDPadRight();
    impl.pressDPadDown();
    impl.pressA();
    impl.pressA();
}

void controllerNavigationStrategy::firstBet() const {
    // Run reset once
    reset();
}