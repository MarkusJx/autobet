#define __STDC_WANT_LIB_EXT1__
#include "historic_data.hpp"
#include "util/utils.hpp"

#include <csv.hpp>
#include <mutex>
#include <ctime>

#define ASSERT_FILE() std::unique_lock lock(mtx); \
                        if (!file_ptr) return

std::unique_ptr<markusjx::csv_file> file_ptr = nullptr;
markusjx::csv_file &file = *file_ptr;
static std::mutex mtx;

void markusjx::autobet::historic_data::init() {
    std::unique_lock lock(mtx);
    if (!file_ptr) {
        file_ptr = std::make_unique<markusjx::csv_file>(utils::get_or_create_documents_folder() + "\\stats.csv");
        file = *file_ptr;

        std::time_t cur_time = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
        std::string time(40, '\0');
        if (ctime_s(time.data(), time.size(), &cur_time) == 0) {
            time.resize(strlen(time.c_str()));
        } else {
            time = "Could not get the time";
        }

        file << "Run started at:" << time << std::endl;
        file << "Horse #1" << "Horse #2" << "Horse #3" << "Horse #4" << "Horse #5" << "Horse #6";
        file << "Bet placed on" << "Won" << "Winner" << "Second place" << "Third place" << "Payout/Loss" << std::endl;
    }
}

bool markusjx::autobet::historic_data::should_save() {
    return file_ptr.operator bool();
}

void markusjx::autobet::historic_data::save_odds(const std::vector<std::string> &odds) {
    ASSERT_FILE();
    for (const auto &o: odds) {
        file << o;
    }
}

void markusjx::autobet::historic_data::save_bet_placed_on(short pos) {
    ASSERT_FILE();
    if (pos == -1) {
        file << file[file.size()][0];
        file[file.size()][8] = -100;
    } else if (pos == -2) {
        file << "error";
    } else {
        file << file[file.size()][pos];
        file[file.size()][8] = -10000;
    }
}

void markusjx::autobet::historic_data::save_winnings(int winnings) {
    ASSERT_FILE();
    //if (winnings > 0) {
    file[file.size()][7] = true;
    file[file.size()][11] = winnings;
    /*} else {
        file[file.size()][7] = false;
    }*/

    file << std::endl;
}

void markusjx::autobet::historic_data::save_winning_odds(const std::string &o1, const std::string &o2,
                                                         const std::string &o3) {
    file[file.size()][8] = o1;
    file[file.size()][9] = o2;
    file[file.size()][10] = o3;
}

void markusjx::autobet::historic_data::close() {
    std::unique_lock lock(mtx);
    file_ptr.reset();
}