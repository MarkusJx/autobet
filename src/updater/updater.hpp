//
// Created by markus on 16/01/2020.
//

#ifndef GTA_ONLINE_AUTOBET_DEV_UPDATER_HPP
#define GTA_ONLINE_AUTOBET_DEV_UPDATER_HPP

#define AUTOBET_CURRENT_VERSION "1.0"

#include "../logger.hpp"
#include "../utils.hpp"

#include <algorithm>
#include <iostream>

namespace updater {
    class Version {
    public:
        explicit Version(const std::string &verString) {
            std::vector<char *> v;
            utils::splitString(verString, ".", &v);

            length = (int) v.size();
            ver = (int *) malloc(length * sizeof(int));

            for (int i = 0; i < length; i++) {
                ver[i] = std::atoi(v[i]);
                free(v[i]); // Free the memory allocated by strdup()
            }

            std::vector<char *>().swap(v);
        }

        bool operator>(const Version& other) {
            int ml = std::min(length, other.length);
            for (int i = 0; i < ml; i++) {
                if (this->ver[i] > other.ver[i]) {
                    return true;
                } else if (this->ver[i] == other.ver[i]) {
                    continue;
                } else {
                    return false;
                }
            }

            return this->length > other.length;
        }

        bool operator<(const Version& other) {
            int ml = std::min(this->length, other.length);
            for (int i = 0; i < ml; i++) {
                if (this->ver[i] < other.ver[i]) {
                    return true;
                } else if (this->ver[i] == other.ver[i]) {
                    continue;
                } else {
                    return false;
                }
            }

            return this->length < other.length;
        }

        bool operator==(const Version& other) {
            if (this->length != other.length) {
                return false;
            }

            for (int i = 0; i < this->length; i++) {
                if (this->ver[i] != other.ver[i]) {
                    return false;
                }
            }

            return true;
        }

        bool operator>=(const Version& other) {
            return *this == other || *this > other;
        }

        bool operator<=(const Version& other) {
            return *this == other || *this < other;
        }

        bool operator>(Version *other) {
            return operator>(*other);
        }

        bool operator<(Version *other) {
            return operator<(*other);
        }

        bool operator==(Version *other) {
            return operator==(*other);
        }

        bool operator>=(Version *other) {
            return *this == other || *this > other;
        }

        bool operator<=(Version *other) {
            return *this == other || *this < other;
        }

        ~Version() {
            free(ver);
        }

        int *ver;
        int length;
    };

    void setLogger(Logger *);

    /**
     * Check for updates
     *
     * @param version A pointer to an array of chars which will contain the latest version string
     * @warning the version pointer must be freed with free()
     * @return if a new version is available
     */
    bool check(char **version = nullptr);

    void download(const std::string &version);

    bool checkSignature(const std::string &version);

    void installUpdate(char *path);

    void abortDownload();

    bool prepareUpdate();

    void cleanup();

    bool updateDownloaded();

    void deleteUpdate();
}

#endif //GTA_ONLINE_AUTOBET_DEV_UPDATER_HPP
