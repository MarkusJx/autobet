//
// Created by markus on 11/03/2020.
//

#ifndef AUTOBET_SETTINGS_HPP
#define AUTOBET_SETTINGS_HPP

#include "logger.hpp"

namespace settings {
    typedef struct posConfig_s {
        unsigned int width = 0;
        unsigned int x = 0;
    } posConfig;

    class posConfigArr {
    public:
        explicit posConfigArr(const std::map<int, int>& m) {
            arr = (posConfig *) calloc(m.size(), sizeof(posConfig));
            size = m.size();

            int i = 0;
            for (std::pair<int, int> p : m) {
                arr[i].width = p.first;
                arr[i].x = p.second;
                i++;
            }
        }

        posConfigArr() {
            size = 0;
            arr = nullptr;
        }

        int getNext(int width) {
            posConfig closest;

            for (int i = 0; i < size; i++) {
                if (closest.width == 0) {
                    closest = arr[i];
                } else {
                    int d1 = abs((int) closest.width - width);
                    int d2 = abs((int) arr[i].width - width);
                    if (d2 < d1) {
                        closest = arr[i];
                    }
                }
            }

            if (closest.width == 0) {
                return -1;
            } else {
                return (int) closest.x;
            }
        }

        void generate(size_t newSize) {
            free(arr);
            arr = (posConfig *) calloc(newSize, sizeof(posConfig));
            size = newSize;
        }

        void reGen() {
            size_t newSize = 0;
            for (int i = 0; i < size; i++) {
                if (arr[i].width > 0 && arr[i].x > 0) {
                    newSize++;
                }
            }

            if (newSize != size) {
                auto *nArr = (posConfig *) calloc(newSize, sizeof(posConfig));
                int pos = 0;
                for (int i = 0; i < size; i++) {
                    if (arr[i].width > 0 && arr[i].x > 0) {
                        nArr[pos] = arr[i];
                        pos++;
                    }
                }

                free(arr);
                size = newSize;
                arr = nArr;
            }
        }

        ~posConfigArr() {
            free(arr);
        }

        size_t size;
        posConfig *arr;
    };

    void setLogger(Logger *logger);

    void save(unsigned int time_sleep, unsigned int clicks, posConfigArr *arr);

    void load(unsigned int &time_sleep, unsigned int &clicks, posConfigArr *arr);

    void storeConfig(unsigned int time_sleep, unsigned int clicks, posConfigArr *arr);

    void loadConfig(unsigned int &time_sleep, unsigned int &clicks, posConfigArr *arr);

    void configure(std::map<int, int> &map);
}

#endif //AUTOBET_SETTINGS_HPP
