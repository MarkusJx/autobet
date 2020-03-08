//
// Created by markus on 16/01/2020.
// Source: https://gist.github.com/irbull/08339ddcd5686f509e9826964b17bb59
//

#include "verifyFile.hpp"

#ifdef AUTOBET_BUILD_UPDATER
#include <iostream>
#include <utility>
#include <openssl/aes.h>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/bio.h>
#include <fstream>

Logger *logger_vf = nullptr;

#define LOGGER_ERROR(msg) if (logger_vf) logger_vf->Error(msg)

const char *publicKey = "-----BEGIN PUBLIC KEY-----\n"
                        "MIIEIjANBgkqhkiG9w0BAQEFAAOCBA8AMIIECgKCBAEAtIaXi3E/2gRbT07cs1Ua\n"
                        "kmAiseAQI8LZsubNzPv21DJr6nLe3jtk1xCc/ssW0s/0CEenXx7Eokrb10alLvPz\n"
                        "jHSaerF2GtEP4GimuXCteRrOk4jouirzkhvgZs9urc6E/NlvAHLFfT9Ln7yILaG0\n"
                        "J3kcPIl/4pSBzr/W11+HErqUK7WVhVkzZacveFaJCHEpuNYAiKHfNsvHQniuUZSa\n"
                        "7OfrcdMNAenb0ypt0rw/2L6JTTTnooMTzRqsAqsPSjZvFztSuyjQykICuAL0vz8k\n"
                        "VKmQZ/j6Zm/SrURGheanXzdnorqr4TYHtgCoqJdkeuUAmYGRq+NeamJdBBV+eyqq\n"
                        "yilQJ5kR0lVJ6BpwVAa2xvtSj20weRV3BgZyI3q2KYL/gKuLcxxHaW8lpSr+KWin\n"
                        "tfbcCZHbYIuMEQDRZzaj2FQEUOfkxBRbtBlxWLcwv9ELl9DGwtx1t6nSfSK6HcSP\n"
                        "VcnHPWvNOdqetv80XZYJA2b2N82KoVkk33m0bu+JXHF1ESSRySfjYgkpmDx+IXdN\n"
                        "sGp88txI+0QvsCbH/+SjAviVCDuyWwkZ3kMK6wNCd3vYL79imykevHHOoRXO1bAn\n"
                        "hdAVmudsqFEls/h83MOoSaqp32cOGo2JMuSvC7pozuT0b120fFKWttYZeLGCPzjY\n"
                        "jRuYZB7Z5HK9AaI+cUAxnr8TxXEhfA+uf4Jf7RN9xlESMDPOdOgxXbqDlKdvRJa+\n"
                        "uVUoKjLgWRCuOIcuGIRaw4/emuW/QbqIFDPK7IWekAVi1B5sv/kSqkz+Zyddr12f\n"
                        "xET8Ac5SuRVV4vYqffhFaAbB587XRex0DbZEXPWYx6z9TrzcQotBs3oPITEoyQS0\n"
                        "46SdULi/gIzim2nbThG5UH1UDWob9zTHqNBTrjKBHcUfbPL5gW1oyla+u3M5w+rP\n"
                        "DjMr9Qwxhb6E9ExsHQOUK8fNfBYoJbU8C729tBW2RcIYBMW5S5QgWIV4hLNIi3x/\n"
                        "NkCdheBE9Qu0+PtifTscBD9DyAaegfh2pOdilMAkKNxKqdWLLjPWm5QlcHoNlh5/\n"
                        "drYczJ7GPr+HW3pqifB2taYnme2wV+oUmafTxtO3+Q1DQVaZkt/2+omzPv/XYB5x\n"
                        "W31oSQvKU018Ml3bGHgryClETkp4kvlwFWk2nP1752C1S5Vuw3KFsQl5hlfPSB7b\n"
                        "YN6EZgNnrz/yxaYEfFbHZa2aomvVDQMWbqSYImnFrsV/Dd7ZTMhFAy+bM0mstJtG\n"
                        "HEB/eVaysRNqQNmIJ0nRnK6Y2yLp05RiFeXLNj+g9AOKAci7xTxgTGZ2oRNI4/Py\n"
                        "mnjs2Kldjyex/TDnMu0c2NrkvyjbgKmDyEkrWJpkEWmqGeSjbbzaCSFnK6JrIQrb\n"
                        "ZwIDAQAB\n"
                        "-----END PUBLIC KEY-----";

RSA *createPrivateRSA(const std::string &key) {
    RSA *rsa = nullptr;
    const char *c_string = key.c_str();
    BIO *keybio = BIO_new_mem_buf((void *) c_string, -1);
    if (keybio == nullptr) {
        return nullptr;
    }
    rsa = PEM_read_bio_RSAPrivateKey(keybio, &rsa, nullptr, nullptr);
    return rsa;
}

RSA *createPublicRSA(const std::string &key) {
    RSA *rsa = nullptr;
    BIO *keybio;
    const char *c_string = key.c_str();
    keybio = BIO_new_mem_buf((void *) c_string, -1);
    if (keybio == nullptr) {
        return nullptr;
    }
    rsa = PEM_read_bio_RSA_PUBKEY(keybio, &rsa, nullptr, nullptr);
    return rsa;
}

bool RSASign(RSA *rsa, const unsigned char *Msg, size_t MsgLen, unsigned char **EncMsg, size_t *MsgLenEnc) {
    EVP_MD_CTX *m_RSASignCtx = EVP_MD_CTX_create();
    EVP_PKEY *priKey = EVP_PKEY_new();
    EVP_PKEY_assign_RSA(priKey, rsa);
    if (EVP_DigestSignInit(m_RSASignCtx, nullptr, EVP_sha256(), nullptr, priKey) <= 0) {
        return false;
    }
    if (EVP_DigestSignUpdate(m_RSASignCtx, Msg, MsgLen) <= 0) {
        return false;
    }
    if (EVP_DigestSignFinal(m_RSASignCtx, nullptr, MsgLenEnc) <= 0) {
        return false;
    }
    *EncMsg = (unsigned char *) malloc(*MsgLenEnc);
    if (EVP_DigestSignFinal(m_RSASignCtx, *EncMsg, MsgLenEnc) <= 0) {
        return false;
    }
    EVP_MD_CTX_destroy(m_RSASignCtx);
    return true;
}

bool RSAVerifySignature(RSA *rsa, unsigned char *MsgHash, size_t MsgHashLen, const char *Msg, size_t MsgLen,
                        bool *Authentic) {
    *Authentic = false;
    EVP_PKEY *pubKey = EVP_PKEY_new();
    EVP_PKEY_assign_RSA(pubKey, rsa);
    EVP_MD_CTX *m_RSAVerifyCtx = EVP_MD_CTX_create();

    if (EVP_DigestVerifyInit(m_RSAVerifyCtx, nullptr, EVP_sha256(), nullptr, pubKey) <= 0) {
        return false;
    }
    if (EVP_DigestVerifyUpdate(m_RSAVerifyCtx, Msg, MsgLen) <= 0) {
        return false;
    }
    int AuthStatus = EVP_DigestVerifyFinal(m_RSAVerifyCtx, MsgHash, MsgHashLen);
    if (AuthStatus == 1) {
        *Authentic = true;
        EVP_MD_CTX_destroy(m_RSAVerifyCtx);
        return true;
    } else {
        *Authentic = false;
        EVP_MD_CTX_destroy(m_RSAVerifyCtx);
        return AuthStatus == 0;
    }
}

void Base64Encode(const unsigned char *buffer,
                  size_t length,
                  char **base64Text) {
    BIO *bio, *b64;
    BUF_MEM *bufferPtr;

    b64 = BIO_new(BIO_f_base64());
    bio = BIO_new(BIO_s_mem());
    bio = BIO_push(b64, bio);

    BIO_write(bio, buffer, (int) length);
    BIO_flush(bio);
    BIO_get_mem_ptr(bio, &bufferPtr);
    BIO_set_close(bio, BIO_NOCLOSE);
    BIO_free_all(bio);

    *base64Text = (*bufferPtr).data;
}

size_t calcDecodeLength(const char *b64input) {
    size_t len = strlen(b64input), padding = 0;

    if (b64input[len - 1] == '=' && b64input[len - 2] == '=') //last two chars are =
        padding = 2;
    else if (b64input[len - 1] == '=') //last char is =
        padding = 1;
    return (len * 3) / 4 - padding;
}

void Base64Decode(const char *b64message, unsigned char **buffer, size_t *length) {
    BIO *bio, *b64;

    int decodeLen = (int) calcDecodeLength(b64message);
    *buffer = (unsigned char *) malloc(decodeLen + 1);
    (*buffer)[decodeLen] = '\0';

    bio = BIO_new_mem_buf(b64message, -1);
    b64 = BIO_new(BIO_f_base64());
    bio = BIO_push(b64, bio);

    *length = BIO_read(bio, *buffer, (int) strlen(b64message));
    BIO_free_all(bio);
}
#endif

void fileCrypt::setLogger(Logger *logger) {
#ifdef AUTOBET_BUILD_UPDATER
    logger_vf = logger;
#endif
}

void fileCrypt::signInstaller() {
#ifdef AUTOBET_BUILD_UPDATER
    const char *dig = fileCrypt::signMessage("private.pem", "autobet_installer.exe");
    if (dig)
        fileCrypt::writeToFile("autobet_installer.pem", dig);
#endif
}

void fileCrypt::writeToFile(const std::string &path, const char *toWrite) {
#ifdef AUTOBET_BUILD_UPDATER
    std::ofstream stream(path, std::ios::binary);
    if (!stream.is_open()) {
        LOGGER_ERROR("Unable to write to file: " + path);
        return;
    }

    stream.write(toWrite, strlen(toWrite));
    stream.flush();
    stream.close();
#endif
}

std::string fileCrypt::getFileContent(const std::string &path) {
#ifdef AUTOBET_BUILD_UPDATER
    std::ifstream file(path);
    if (!file.is_open()) {
        LOGGER_ERROR("Unable to read file: " + path);
        return "";
    }

    std::string content((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());
    file.close();

    return content;
#else
    return "";
#endif
}

char *fileCrypt::signMessage(const std::string &privateKeyPath, const std::string &plainTextPath) {
#ifdef AUTOBET_BUILD_UPDATER
    std::string privateKey = getFileContent(privateKeyPath);
    if (privateKey.empty()) return nullptr;
    RSA *privateRSA = createPrivateRSA(privateKey);
    unsigned char *encMessage;
    char *base64Text;
    size_t encMessageLength;
    std::string plainText = getFileContent(plainTextPath);
    if (plainText.empty()) return nullptr;
    RSASign(privateRSA, (unsigned char *) plainText.c_str(), plainText.length(), &encMessage, &encMessageLength);
    Base64Encode(encMessage, encMessageLength, &base64Text);
    free(encMessage);
    return base64Text;
#else
    return nullptr;
#endif
}

bool fileCrypt::verifySignature(const std::string &plainTextPath, const std::string &signatureBase64) {
#ifdef AUTOBET_BUILD_UPDATER
    RSA *publicRSA = createPublicRSA(publicKey);
    unsigned char *encMessage;
    size_t encMessageLength;
    bool authentic;
    Base64Decode(signatureBase64.c_str(), &encMessage, &encMessageLength);
    std::string plainText = getFileContent(plainTextPath);
    if (plainText.empty()) return false;
    bool result = RSAVerifySignature(publicRSA, encMessage, encMessageLength, plainText.c_str(), plainText.length(),
                                     &authentic);
    return result & authentic;
#else
    return false;
#endif
}