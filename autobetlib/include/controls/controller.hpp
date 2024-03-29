/**
 * controller.hpp
 *
 * Used for creating virtual XBox controllers.
 * Original idea by GitHub user @xbytex (https://github.com/xbytex):
 * https://github.com/MarkusJx/autobet/issues/6#issue-680353756
 *
 * In order to use this, ScpVbus must be installed: http://vjoystick.sourceforge.net/site/index.php/vxbox
 *
 * Adapted by MarkusJx using the vXbox library, which is licensed under the MIT License:
 * https://github.com/shauleiz/vXboxInterface/blob/master/LICENSE.txt
 *
 * This file is licensed under the MIT License:
 * https://github.com/MarkusJx/autobet/blob/master/LICENSE
 *
 * © MarkusJx 2020
 */
#ifndef AUTOBETLIB_CONTROLLER_HPP
#define AUTOBETLIB_CONTROLLER_HPP

#include <exception>
#include "util/shared_releaser.hpp"

namespace controller {
    /**
     * An exception, thrown if a virtual XBox controller could not be created
     */
    class controllerUnavailableException : public std::exception {
    public:
        using std::exception::exception;
    };

    /**
     * A class for creating a virtual XBox controller
     */
    class GameController {
    public:
        /**
         * Create a null game controller
         * NOTE: DO NOT USE THIS
         */
        explicit GameController(std::nullptr_t);

        /**
         * Create a new controller and plug it in
         *
         * @param click_sleep the time to sleep between the button was pressed and released
         */
        explicit GameController(int click_sleep);

        /**
         * Press the dPad up once
         */
        void pressDPadUp() const;

        /**
         * Press the right dPad once
         */
        void pressDPadRight() const;

        /**
         * Press the dPad down once
         */
        void pressDPadDown() const;

        /**
         * Press the dPad left once
         */
        void pressDPadLeft() const;

        /**
         * Click the 'A' button
         */
        void pressA() const;

        /**
         * Click the 'Y' button
         */
        void pressY() const;

        /**
         * Click the 'B' button
         */
        void pressB() const;

        /**
         * Unplug the controller and destroy it
         */
        ~GameController();

        /**
         * The time to sleep between a button is pressed and released
         */
        int click_sleep;

    private:
        [[maybe_unused]] shared_releaser releaser;

        /**
         * The index of the controller created
         */
        unsigned int index;
    };

    bool scpVBusInstalled();
}

#endif //AUTOBETLIB_CONTROLLER_HPP
