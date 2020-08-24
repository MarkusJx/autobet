#include "debug.hpp"

#ifdef AUTOBET_ENABLE_FULL_DEBUG

#include <mutex>
#include <filesystem>

#include "zip/zip.h"
#include "logger.hpp"

using namespace logger;

std::string home_dir;
unsigned short lastImg = 0;
std::mutex mtx;
struct zip_t *zip;

using namespace debug;
namespace fs = std::filesystem;
#else
#   define DEBUG_UNIMPLEMENTED() logger_d->Unimplemented("Application was built with debug disabled");
#endif

bool debug::init() {
#ifdef AUTOBET_ENABLE_FULL_DEBUG
    utils::path p;
    errno_t err = utils::getDesktopDirectory(p);
    if (err) {
        StaticLogger::error("Unable to get Desktop directory. Error: " + std::to_string(err));
        home_dir = "";
        return false;
    }

    home_dir = p.toString();

    std::string z_name = home_dir;
    z_name.append("\\autobet_debug.zip");
    // No compression, as it does not really affect the file size
    zip = zip_open(z_name.c_str(), 0, 'w');
    return zip != nullptr;
#else
    DEBUG_UNIMPLEMENTED();
    return false;
#endif
}

bool debug::finish() {
#ifdef AUTOBET_ENABLE_FULL_DEBUG
    if (!zip) {
        return false;
    }

    if (fs::exists("autobet.log")) {
        mtx.lock();
        int err = zip_entry_open(zip, "autobet.log");
        if (err) {
            StaticLogger::error("Unable to open debug zip file. Error: " + std::to_string(err));
            mtx.unlock();
            return false;
        }

        err = zip_entry_fwrite(zip, "autobet.log");
        if (err) {
            StaticLogger::error("Unable to write debug zip file. Error: " + std::to_string(err));
            zip_close(zip);
            return false;
        }

        err = zip_entry_close(zip);
        if (err) {
            StaticLogger::error("Unable to close debug zip file. Error: " + std::to_string(err));
            zip_close(zip);
            return false;
        }

        zip_close(zip);
        mtx.unlock();

        return true;
    } else {
        StaticLogger::error("out.log does not exist");
        return false;
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

    StaticLogger::debug("Writing image to debug zip file");
    mtx.lock();
    int err = zip_entry_open(zip, ("img-" + std::to_string(lastImg) + ".png").c_str());
    if (err) {
        StaticLogger::error("Unable to open debug zip file. Error: " + std::to_string(err));
        mtx.unlock();
        return;
    }

    err = zip_entry_write(zip, bmp->data, bmp->size);
    if (err) {
        StaticLogger::error("Unable to write debug zip file. Error: " + std::to_string(err));
    }

    lastImg++;
    err = zip_entry_close(zip);
    if (err) {
        StaticLogger::error("Unable to close debug zip file. Error: " + std::to_string(err));
    }

    mtx.unlock();
#else
    DEBUG_UNIMPLEMENTED();
#endif
}