#ifndef AUTOBET_SETTINGS_HPP
#define AUTOBET_SETTINGS_HPP

/**
 * The settings namespace
 */
namespace settings {
    /**
     * Save the settings
     * 
     * @param debug whether debugging is enabled (no full_debug)
     * @param log whether logging is enabled
     * @param webServer whether the web server is enabled
     * @param time_sleep the time to sleep between bets
     */
    void save(bool debug, bool log, bool webServer, unsigned int time_sleep);

    /**
     * Load the settings
     * 
     * @param debug set the debug value
     * @param log set te log value
     * @param webServer set the webServer value
     * @param time_sleep set the time_sleep value
     */
    void load(bool &debug, bool &log, bool &webServer, unsigned int &time_sleep);
}

#endif //AUTOBET_SETTINGS_HPP
