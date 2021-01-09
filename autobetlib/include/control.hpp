#ifndef AUTOBETLIB_CONTROL_HPP
#define AUTOBETLIB_CONTROL_HPP

namespace control {
    /**
     * Start the betting
     */
    void start_script();

    /**
     * Stop the betting
     */
    void stop_script();

    /**
     * Kill the program and close all connections
     *
     * @param _exit if exit() shall be called
     */
    void kill(bool _exit = true);

    /**
     * Write winnings_all to winnings.dat
     */
    void writeWinnings();

    /**
     * Listen for key combination presses
     */
    void listenForKeycomb();

    /**
     * Check if the betting has been stopped
     *
     * @return if the betting has been stopped
     */
    bool stopped();
}

#endif //AUTOBETLIB_CONTROL_HPP
