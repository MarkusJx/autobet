#include "controller.hpp"

#include <thread>
#include <windows.h>
#include <vXboxInterface.h>
#include "logger.hpp"

controller::controller::controller() {
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

    // TODO: log number of empty slots

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
                    logger::StaticLogger::_error("controller.cpp", __LINE__, "Could not unplug virtual controller");
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
}

bool controller::controller::pressDPadRight() const {
    if (!SetDpadRight(index)) return false;
    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
    if (!SetDpadOff(index)) return false;
    // Sleep some time after releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    return true;
}

bool controller::controller::pressA() const {
    if (!SetBtnA(index, true)) return false;
    // Sleep some time before releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(200));
    if (!SetBtnA(index, false)) return false;
    // Sleep some time after releasing the button
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    return true;
}

controller::controller::~controller() {
    if (!UnPlug(index)) {
        // Try to force unplug
        if (!UnPlugForce(index)) {
            logger::StaticLogger::_error("controller.cpp", __LINE__, "Could not unplug virtual controller");
        }
    }
}