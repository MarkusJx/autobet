#include "debug.hpp"

#include <mutex>
#include <filesystem>
#include <chrono>
#include <ctime>
#include <memory>

#include "zip/src/zip.h"
#include "logger.hpp"

using namespace logger;

std::string home_dir;
unsigned short lastImg = 0;
std::mutex mtx;
struct zip_t *zip;

void _finish();

/**
 * A class for managing the finishing of debugging
 */
class debug_finisher {
public:
    /**
     * Init without finishing anything on destruction
     */
    debug_finisher(std::nullptr_t) noexcept: doFinish(false) {}

    /**
     * Normal init
     */
    debug_finisher() noexcept: doFinish(true) {}

    /**
     * Check if debug should be finished on destruction
     * 
     * @return true, if doFinish == true
     */
    [[nodsicard]] operator bool() const noexcept {
        return doFinish;
    }

    /**
     * Finish up the debugging, if should finish
     */
    void reset() {
        if (doFinish) {
            _finish();
            doFinish = false;
        }
    }

    /**
     * Finish up the debugging if required
     */
    ~debug_finisher() {
        if (doFinish) {
            _finish();
        }
    }

private:
    bool doFinish;
};

debug_finisher finisher = nullptr;

using namespace debug;
namespace fs = std::filesystem;

bool debug::init() {
#   pragma message("INFO: Building with full debug support enabled")
    if (finisher) finisher.reset();

    // Get the desktop directory
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
    if (zip != nullptr) {
        finisher = debug_finisher();
        return true;
    } else {
        return false;
    }
}

void _finish() {
    if (!zip) {
        return;
    }

    if (fs::exists("autobet.log")) {
        mtx.lock();
        int err = zip_entry_open(zip, "autobet.log");
        if (err) {
            StaticLogger::error("Unable to open debug zip file. Error: " + std::to_string(err));
            goto cleanup_unlock;
        }

        err = zip_entry_fwrite(zip, "autobet.log");
        if (err) {
            StaticLogger::error("Unable to write debug zip file. Error: " + std::to_string(err));
            goto cleanup;
        }

        err = zip_entry_close(zip);
        if (err) {
            StaticLogger::error("Unable to close debug zip file. Error: " + std::to_string(err));
        }

    cleanup:
        zip_close(zip);
    cleanup_unlock:
        mtx.unlock();
    } else {
        StaticLogger::error("out.log does not exist");
    }
}

void debug::finish() {
    finisher.reset();
}

void debug::writeImage(const utils::bitmap &bmp) {
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