#ifndef GTA_ONLINE_AUTOBET_DEV_UTILS_HPP
#define GTA_ONLINE_AUTOBET_DEV_UTILS_HPP

#include "main.hpp"

#include <functional>
#include <sstream>
#include <vector>

namespace utils {
    typedef struct windowSize_s {
        int xPos;
        int yPos;
        int width;
        int height;
    } windowSize;

    typedef struct IPv4_s {
        unsigned char b1, b2, b3, b4;

        std::string to_string() {
            std::stringstream stringstream;
            stringstream << std::to_string(b1) << "." << std::to_string(b2) << ".";
            stringstream << std::to_string(b3) << "." << std::to_string(b4);

            return stringstream.str();
        }
    } IPv4;

    class Application;

    bool startup(Application *application, const char* args = nullptr);

    class Application {
    public:
        explicit Application(const std::string &appName);

        bool isRunning();

        inline bool start(const char* args = nullptr) {
            return startup(this, args);
        }

        bool kill();

        ~Application();

        std::string name;
        void *pi;
    };

    using bitmap = std::vector<unsigned char>;

    void setCtrlCHandler(std::function<void()> callback);

    errno_t getDesktopDirectory(std::string &path);

    bool getOwnIP(IPv4 &ownIP);

    void setDpiAware();

    void *TakeScreenShot(int x, int y, int width, int height);

    void getWindowSize(windowSize &ws);

    bitmap crop(int x, int y, int width, int height, void *src);

    bool pressTab();

    bool leftClick(int x, int y, bool move = true);

    bool isProcessRunning(const char *processName);

    int displayError(const std::string &error, const std::function<void()> &callback = nullptr);

    void printSystemInformation();

    void splitString(std::string s, const std::string &delimiter, std::vector<char *> *res);

    bool fileExists(const std::string &name);

    bitmap convertHBitmap(int width, int height, void *HBMP);

    void getActiveScreen(unsigned int xPos, unsigned int yPos, windowSize &ws);

    errno_t isForeground(bool& res);

    inline std::string getLastStringPart(const std::string &str, char delimiter) {
        return str.substr(str.rfind(delimiter) + 1);
    }
}

#endif //GTA_ONLINE_AUTOBET_DEV_UTILS_HPP
