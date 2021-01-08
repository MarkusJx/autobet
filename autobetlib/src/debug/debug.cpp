#include "debug.hpp"

#include <mutex>
#include <filesystem>
#include <chrono>
#include <ctime>
#include <memory>

#include "zip.hpp"
#include "shared_releaser.hpp"
#include "../logger.hpp"
#include "../utils.hpp"

using namespace logger;

std::string home_dir;
unsigned short lastImg = 0;

void _finish();

minizip::zip zip = nullptr;
shared_releaser debug_finisher = nullptr;
//std::shared_ptr<int> debug_finisher = nullptr;

using namespace debug;
namespace fs = std::filesystem;

bool debug::init() {
    StaticLogger::debug("debug::init() called");
    debug_finisher.reset();

    // Get the desktop directory
    errno_t err = utils::getDesktopDirectory(home_dir);
    if (err) {
        StaticLogger::error("Unable to get Desktop directory. Error: " + std::to_string(err));
        home_dir = "";
        return false;
    }

    std::string z_name = home_dir;
    z_name.append("\\autobet_debug.zip");

    char mode = 'w';
    if (fs::exists(z_name)) {
        mode = 'a';
    }

    try {
        zip = minizip::zip(z_name, 0, mode);
        debug_finisher = shared_releaser(_finish);
    } catch (const std::exception &e) {
        StaticLogger::error(e.what());
        try {
            if (fs::exists(z_name)) {
                StaticLogger::debug("Deleting debug zip");
                fs::remove(z_name);
            }
        } catch (const std::exception &e) {
            StaticLogger::error(e.what());
        }
        return false;
    }
    return true;
}

void _finish() {
    if (!zip) {
        return;
    }

    if (fs::exists("autobet.log")) {
        StaticLogger::debug("Writing autobet.log to zip");
        try {
            zip.write("autobet.log", "autobet.log");
        } catch (const std::exception &e) {
            StaticLogger::error(e.what());
        }
    } else {
        StaticLogger::error("autobet.log does not exist");
    }

    zip.reset();
}

void debug::finish() {
    StaticLogger::debug("debug::finish called");
    debug_finisher.reset();
}

void debug::writeImage(const utils::bitmap &bmp) {
    StaticLogger::debug("Writing image to debug zip file");
    std::string img_name = "img-" + std::to_string(lastImg) + ".png";

    try {
        zip.write(img_name, bmp);
        lastImg++;
    } catch (const std::exception &e) {
        StaticLogger::error(e.what());
    }
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