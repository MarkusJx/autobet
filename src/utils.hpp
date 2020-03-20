//
// Created by markus on 27/12/2019.
//

#ifndef GTA_ONLINE_AUTOBET_DEV_UTILS_HPP
#define GTA_ONLINE_AUTOBET_DEV_UTILS_HPP

#include "logger.hpp"
#include "main.hpp"

#include <functional>
#include <sstream>

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

    template<typename T>
    struct Array {
    public:
        explicit Array(size_t size) {
            this->data = (T *) calloc(size, sizeof(T));
            this->size = size;
        }

        Array(T *data, size_t size) {
            this->data = (T *) calloc(size, sizeof(T));
            if (data) {
#ifdef AUTOBET_WINDOWS
                memcpy_s(this->data, size, data, size);
#else
                memcpy(this->data, data, size);
#endif
            }
            this->size = size;
        }

        T &operator[](int index) {
            return data[index];
        }

        void setData(T newData) {
            memcpy(this->data, newData, size);
        }

        void setData(T newData, size_t newSize) {
            if (size == newSize) {
                setData(newData);
            } else {
                size = newSize;
                data = (char *) realloc(data, size);
            }
        }

        /**
         * Resize the array
         *
         * @param newSize the new size of the array
         * @return 0 if no errors, else a error code from memcpy_s or -1 if the allocation failed or 1 if the size was not changed
         */
        errno_t resize(size_t newSize) {
            if (size != newSize) {
                char *tmp = (char *) calloc(newSize, sizeof(char));
                if (!tmp) {
                    return -1;
                }

                errno_t err;
                if (newSize > size)
                    err = memcpy_s(tmp, newSize, data, size);
                else
                    err = memcpy_s(tmp, newSize, data, newSize);
                if (err) {
                    free(tmp);
                    return err;
                }
                free(data);
                data = tmp;
                size = newSize;
                return 0;
            } else {
                return 1;
            }
        }

        ~Array() {
            free(data);
        }

        T *data;
        size_t size = 0;
    };

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

    typedef struct Array_path : Array<char> {
        Array_path() : Array(261) {}

        std::string toString() {
            std::string s(data, size - 1);
            return s;
        }
    } path;

    typedef struct Array<char> bitmap;

    void setCtrlCHandler(std::function<void()> callback);

    errno_t getDesktopDirectory(path &p);

    bool getOwnIP(IPv4 &ownIP);

    void setDpiAware();

    int findIncreaseBetButton(windowSize ws, float multiplierH);

    void *TakeScreenShot(int x, int y, int width, int height);

    void getWindowSize(windowSize &ws);

    bitmap *crop(int x, int y, int width, int height, void *src);

    //bool rightClick(int x, int y);

    bool leftClick(int x, int y, bool move = true);

    bool isProcessRunning(const char *processName);

    int displayError(const std::string &error, const std::function<void()> &callback = nullptr);

    void setLogger(Logger *logger);

    void printSystemInformation();

    void splitString(std::string s, const std::string &delimiter, std::vector<char *> *res);

    bool fileExists(const std::string &name);

    //void saveBmp(std::string path, bitmap *bmp);

    //void saveHBitmap(std::string path, int width, int height, void *HBMP);

    bitmap *convertHBitmap(int width, int height, void *HBMP);

    void getActiveScreen(unsigned int xPos, unsigned int yPos, windowSize &ws);

    errno_t isForeground(bool& res);

    inline std::string getLastStringPart(const std::string &str, char delimiter) {
        return str.substr(str.rfind(delimiter) + 1);
    }
}

#endif //GTA_ONLINE_AUTOBET_DEV_UTILS_HPP
