#include "debug.hpp"

#ifdef AUTOBET_ENABLE_FULL_DEBUG

#include <mutex>
#include <filesystem>
#include <chrono>
#include <ctime>

#include "zip/src/zip.h"
#include "logger.hpp"

using namespace logger;

std::string home_dir;
unsigned short lastImg = 0;
std::mutex mtx;
struct zip_t *zip;

using namespace debug;
namespace fs = std::filesystem;
#else
#   define DEBUG_UNIMPLEMENTED() StaticLogger::unimplemented("Application was built with debug disabled");
#endif

bool debug::init() {
#ifdef AUTOBET_ENABLE_FULL_DEBUG
#   pragma message("Building with full debug support enabled")
    std::string path;
    errno_t err = utils::getDesktopDirectory(path);
    if (err) {
        StaticLogger::error("Unable to get Desktop directory. Error: " + std::to_string(err));
        home_dir = "";
        return false;
    }

    home_dir = path;

    std::string z_name = home_dir;
    z_name.append("\\autobet_debug.zip");
    // No compression, as it does not really affect the file size
    zip = zip_open(z_name.c_str(), 0, 'w');
    return zip != nullptr;
#else
#   pragma message("Building with full debug support disabled")
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

void debug::writeImage(const utils::bitmap &bmp) {
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

    err = zip_entry_write(zip, (char *) bmp.data(), bmp.size());
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

bool debug::checkLogAge() {
    namespace fs = std::filesystem;
    using namespace std::chrono;
    if (fs::exists("autobet.log")) {
        fs::file_time_type last_write = fs::last_write_time("autobet.log");
        auto sctp = time_point_cast<system_clock::duration>(
                last_write - fs::file_time_type::clock::now() + system_clock::now());

        std::time_t time_file = system_clock::to_time_t(sctp);
        std::time_t time_now = time(nullptr);

        struct tm tm_file{};
        struct tm tm_now{};
        errno_t err = localtime_s(&tm_file, &time_file);
        err += localtime_s(&tm_now, &time_now);

        if (err != 0) {
            // Could not check log age: localtime_s returned a non-zero exit code
            return false;
        }

        int days = tm_now.tm_yday - tm_file.tm_yday;
        days += (tm_now.tm_year - tm_file.tm_year) * 365;

        if (days >= 7) {
            fs::remove("autobet.log");
            if (fs::exists("autobet_debug.log")) fs::remove("autobet_debug.log");
            // Log deleted
            return true;
        }
    }

    return false;
}