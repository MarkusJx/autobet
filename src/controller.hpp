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
#ifndef AUTOBET_CONTROLLER_HPP
#define AUTOBET_CONTROLLER_HPP

#include <exception>

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
    class controller {
    public:
        /**
         * Create a new controller and plug it in
         */
        controller();

        /**
         * Press the right dPad once
         *
         * @return if the dPad could be pressed
         */
        [[nodiscard]] bool pressDPadRight() const;

        /**
         * Click the 'A' button
         *
         * @return if the button could be pressed
         */
        [[nodiscard]] bool pressA() const;

        /**
         * Unplug the controller and destroy it
         */
        ~controller();

    private:
        /**
         * The index of the controller created
         */
        unsigned int index;
    };

    bool scpVBusInstalled();

#if defined(AUTOBET_BUILD_UPDATER) && defined(AUTOBET_ENABLE_FULL_DEBUG)
    bool downloadAndInstallScpVBus();

    bool downloadAndUninstallScpVBus();
#endif // AUTOBET_BUILD_UPDATER
}

#endif //AUTOBET_CONTROLLER_HPP
