#include "controls/controller.hpp"

#include <windows.h>

#include <thread>
#include "controls/vXboxInterface.h"
#include "logger.hpp"

using namespace logger;

controller::GameController::GameController(std::nullptr_t): releaser(nullptr), click_sleep(0) {
    this->index = 0;
}

controller::GameController::GameController(int click_sleep) : releaser(nullptr), click_sleep(click_sleep) {
    unsigned char nEmpty;

    // Test if bus exists
    if (!isVBusExists()) {
        throw controllerUnavailableException("Virtual Xbox bus does not exist");
    }

    // Get the number of empty slots, fail if not enough slots are available
    if (!GetNumEmptyBusSlots(&nEmpty)) {
        throw controllerUnavailableException("Cannot determine number of empty slots");
    } else if (nEmpty < 1) {
        throw controllerUnavailableException("Not enough empty bus slots available");
    }

    logger::StaticLogger::debugStream() << "Determined number of empty controller slots: " << static_cast<int>(nEmpty);

    bool success = false;

    // Try plugging in any controller
    for (int i = 4 - nEmpty; i < 4; i++) {
        // If the controller doesn't exist, try to plug it in
        if (!isControllerExists(i) && PlugIn(i)) {
            // Check if the controller creation was successful
            if (isControllerExists(i) && isControllerOwned(i)) {
                success = true;
                this->index = i;
                break;
            } else if (!UnPlug(i)) { // Try to unplug the device
                // Try to force unplug
                if (!UnPlugForce(i)) {
                    logger::StaticLogger::error("Could not unplug virtual controller");
                }
            }
        }
    }

    // If the controller could not be plugged in, throw an exception
    if (!success) {
        throw controllerUnavailableException("Could not plug in a virtual controller");
    }

    // Sleep for 50 millis so the device can be used
    std::this_thread::sleep_for(std::chrono::milliseconds(50));

    // Copy the index and create the releaser
    unsigned int index_cpy = this->index;
    releaser = shared_releaser([index_cpy] {
        if (!UnPlug(index_cpy)) {
            // Try to force unplug
            if (!UnPlugForce(index_cpy)) {
                logger::StaticLogger::error("Could not unplug virtual controller");
            }
        }
    });
}

void controller::GameController::pressDPadUp() const {
    if (!SetDpadUp(index)) {
        StaticLogger::error("Could not press the d-pad up");
        return;
    }

    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(click_sleep));
    if (!SetDpadOff(index)) {
        StaticLogger::error("Could not release the d-pad up");
    }
}

void controller::GameController::pressDPadRight() const {
    if (!SetDpadRight(index)) {
        StaticLogger::error("Could not press the d-pad right");
        return;
    }

    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(click_sleep));
    if (!SetDpadOff(index)) {
        StaticLogger::error("Could not release the d-pad right");
    }
}

void controller::GameController::pressDPadDown() const {
    if (!SetDpadDown(index)) {
        StaticLogger::error("Could not press the d-pad down");
        return;
    }

    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(click_sleep));
    if (!SetDpadOff(index)) {
        StaticLogger::error("Could not release the d-pad down");
    }
}

void controller::GameController::pressDPadLeft() const {
    if (!SetDpadLeft(index)) {
        StaticLogger::error("Could not press the d-pad left");
        return;
    }

    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(click_sleep));
    if (!SetDpadOff(index)) {
        StaticLogger::error("Could not release the d-pad left");
    }
}

void controller::GameController::pressA() const {
    if (!SetBtnA(index, true)) {
        StaticLogger::error("Could not press the 'A' button");
        return;
    }

    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(click_sleep));
    if (!SetBtnA(index, false)) {
        StaticLogger::error("Could not release the 'A' button");
    }
}

void controller::GameController::pressY() const {
    if (!SetBtnY(index, true)) {
        StaticLogger::error("Could not press the 'Y' button");
        return;
    }

    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(click_sleep));
    if (!SetBtnY(index, false)) {
        StaticLogger::error("Could not release the 'Y' button");
    }
}

void controller::GameController::pressB() const {
    if (!SetBtnB(index, true)) {
        StaticLogger::error("Could not press the 'B' button");
        return;
    }

    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(click_sleep));
    if (!SetBtnB(index, false)) {
        StaticLogger::error("Could not release the 'B' button");
    }
}

controller::GameController::~GameController() = default;

bool controller::scpVBusInstalled() {
    return isVBusExists();
}
