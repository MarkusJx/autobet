//
// Created by markus on 16/01/2020.
//

#ifndef AUTOBET_VERIFYFILE_HPP
#define AUTOBET_VERIFYFILE_HPP

#include <string>
#include "../logger.hpp"

namespace fileCrypt {
    std::string getFileContent(const std::string &path);

    char *signMessage(const std::string &privateKeyPath, const std::string &plainTextPath);

    bool verifySignature(const std::string &plainTextPath, const std::string &signatureBase64);

    void writeToFile(const std::string &path, const char *toWrite);

    void signInstaller();

    void setLogger(Logger *logger);
}

#endif //AUTOBET_VERIFYFILE_HPP
