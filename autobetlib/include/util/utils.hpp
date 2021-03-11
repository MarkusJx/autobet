#ifndef GTA_ONLINE_AUTOBET_DEV_UTILS_HPP
#define GTA_ONLINE_AUTOBET_DEV_UTILS_HPP

#include <functional>
#include <vector>

#include "main.hpp"
#include "windowUtils.hpp"

/**
 * Utility namespace
 */
namespace utils {
    /**
     * A struct for storing IPv4 addresses in human-readable form
     */
    typedef struct IPv4_s {
        unsigned char b1, b2, b3, b4;

        /**
         * Concatenate all parts to a proper IPv4 address
         * 
         * @return the ip address as a string
         */
        [[nodiscard]] std::string to_string() const;
    } IPv4;

    /**
     * A bitmap
     */
    using bitmap = std::vector<unsigned char>;

    /**
     * Set the ctrl-c handler
     * 
     * @param callback the callback function
     */
    void setCtrlCHandler(std::function<void()> callback);

    /**
     * Get the desktop directory for the current user.
     * Source: https://stackoverflow.com/a/17935926
     * 
     * @param path the path to be set
     * @return 0, if everything is ok, an error code otherwise
     */
    errno_t getDesktopDirectory(std::string &path);

    /**
     * Get the ip address of this machine.
     * Source: https://stackoverflow.com/a/122225
     * 
     * @param ownIP the ip struct to be filled
     * @return true, if the operation was successful
     */
    bool getOwnIP(IPv4 &ownIP);

    /**
     * Get this PCs IP address
     *
     * @return this PCs IP address was a string in the IPv4 format, e.g. xxx.xxx.xxx.xxx
     */
    std::string getIP();

    /**
     * Open a web page in a browser
     *
     * @param address the address of the web page to open
     * @return whether the website could be opened in a browser
     */
    bool openWebsite(const std::string &address);

    /**
     * Set this process DPI aware
     */
    void setDpiAware();

    /**
     * Take a screenshot and return its HBITMAP as a void pointer.
     * Source: https://stackoverflow.com/a/55938188
     * 
     * @param x the x-position of the screenshot
     * @param y the y-position of the screenshot
     * @param width the width of the screenshot
     * @param height the height of the screenshot
     * @return the screenshot. Must be freed using DeleteObject()
     */
    void *TakeScreenShot(int x, int y, int width, int height);

    /**
     * Get the window size for the GTA 5 window
     */
    windowUtils::windowSize getWindowSize();

    /**
     * Crop a screenshot taken with TakeScreenShot(4)
     * 
     * @param x the x-position to crop to
     * @param y the y-position to crop to
     * @param width the width of the resulting image
     * @param height the height of the resulting image
     * @param src the screenshot returned by TakeScreenShot. NOTE: This function does not free the screenshot
     * @return the resulting bitmap
     */
    bitmap crop(int x, int y, int width, int height, void *src);

    /**
     * Press the tab button
     *
     * @param sleep the time to sleep between each action
     * @return true, if the operation was successful
     */
    bool pressTab(int sleep);

    /**
     * Left click onto a position
     * 
     * @param x the x-position to click on
     * @param y the y-position to clock on
     * @param sleep the time to sleep between each action
     * @param move whether to move the mouse. If set to false, the params x and y are ignored
     * @return true, if the operation was successful
     */
    bool leftClick(int x, int y, int sleep, bool move = true);

    /**
     * Check if the game is running
     *
     * @return true, if the process is running
     */
    bool gameIsRunning();

    /**
     * Display an error dialogue
     * 
     * @param error the error message
     * @param callback the callback function to be called when the dialogue is closed
     * @return The messageBox id
     */
    int displayError(const std::string &error, const std::function<void()> &callback = nullptr);

    /**
     * Print system information to the logger
     */
    void printSystemInformation();

    /**
     * Check if a file exists.
     * Source: https://stackoverflow.com/a/12774387
     * 
     * @param name the file name
     * @return true, if the file exists
     */
    bool fileExists(const std::string &name);

    /**
     * Convert a HBitmap to a bitmap
     * 
     * @param width the new width
     * @param height the new height
     * @param HBMP the HBitmap to convert (from TakeScreenShot)
     * @return the resulting bitmap
     */
    bitmap convertHBitmap(int width, int height, void *HBMP);

    /**
     * Get the active screen by x and y coordinates.
     * Returns the screen where x and y are mapped to.
     * 
     * @param xPos the x position
     * @param yPos the y position
     * @param ws the screen position and size to be set
     */
    windowUtils::windowSize getActiveScreen(unsigned int xPos, unsigned int yPos);

    /**
     * Check if GTA 5 is in foreground
     * 
     * @param res the result. Is set to true, if the window is in foreground
     * @return 0 if everything is ok, an error code otherwise
     */
    errno_t isForeground(bool& res);

    /**
     * Check if this program is already running.
     * Source: https://stackoverflow.com/a/14176581
     *
     * @param programName the program name
     * @return true, if this program is already running
     */
    bool isAlreadyRunning(const std::string &programName);

    /**
     * Get the documents folder.
     * Source: https://stackoverflow.com/a/2414852
     *
     * @return the documents folder path
     */
    std::string getDocumentsFolder();
}

#endif //GTA_ONLINE_AUTOBET_DEV_UTILS_HPP
