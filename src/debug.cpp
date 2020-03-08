//
// Created by markus on 04/03/2020.
//
#include "debug.hpp"

#ifdef AUTOBET_ENABLE_FULL_DEBUG

#include <mutex>
#include <filesystem>

#include "utils.hpp"
#include "zip/zip.h"

std::string home_dir;
unsigned short lastImg = 0;
std::mutex mtx;
struct zip_t *zip;

using namespace debug;
namespace fs = std::filesystem;
#else
#   define DEBUG_UNIMPLEMENTED() logger_d->Unimplemented("Application was built with debug disabled");
#endif

Logger *logger_d;

void debug::setLogger(Logger *logger) {
    logger_d = logger;
}

bool debug::init() {
#ifdef AUTOBET_ENABLE_FULL_DEBUG
    utils::path p;
    errno_t err = utils::getDesktopDirectory(p);
    if (err) {
        logger_d->Error("Unable to get Desktop directory. Error: " + std::to_string(err));
        home_dir = "";
        return false;
    }

    home_dir = p.toString();

    std::string z_name = home_dir;
    z_name.append("\\autobet_debug.zip");
    zip = zip_open(z_name.c_str(), ZIP_DEFAULT_COMPRESSION_LEVEL, 'w');
    return zip != nullptr;
#else
    DEBUG_UNIMPLEMENTED();
    return false;
#endif
}

void debug::finish() {
#ifdef AUTOBET_ENABLE_FULL_DEBUG
    if (!zip) {
        return;
    }

    if (fs::exists("out.log")) {
        mtx.lock();
        int err = 0;
        err = zip_entry_open(zip, "out.log");
        if (err) {
            logger_d->Error("Unable to open debug zip file. Error: " + std::to_string(err));
            mtx.unlock();
            return;
        }

        err = zip_entry_fwrite(zip, "out.log");
        if (err) {
            logger_d->Error("Unable to write debug zip file. Error: " + std::to_string(err));
            goto exit;
        }

        err = zip_entry_close(zip);
        if (err) {
            logger_d->Error("Unable to close debug zip file. Error: " + std::to_string(err));
        }

        exit:
        zip_close(zip);
        mtx.unlock();
    } else {
        logger_d->Error("out.log does not exist");
    }
#else
    DEBUG_UNIMPLEMENTED();
#endif
}

void debug::writeImage(utils::bitmap *bmp) {
#ifdef AUTOBET_ENABLE_FULL_DEBUG
    if (!zip) {
        return;
    }

    logger_d->Debug("Writing image to debug zip file");
    mtx.lock();
    int err = 0;
    err = zip_entry_open(zip, ("img-" + std::to_string(lastImg) + ".png").c_str());
    if (err) {
        logger_d->Error("Unable to open debug zip file. Error: " + std::to_string(err));
        mtx.unlock();
        return;
    }

    err = zip_entry_write(zip, bmp->data, bmp->size);
    if (err) {
        logger_d->Error("Unable to write debug zip file. Error: " + std::to_string(err));
    }

    lastImg++;
    err = zip_entry_close(zip);
    if (err) {
        logger_d->Error("Unable to close debug zip file. Error: " + std::to_string(err));
    }

    mtx.unlock();
#else
    DEBUG_UNIMPLEMENTED();
#endif
}