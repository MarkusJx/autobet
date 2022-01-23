#define __STDC_WANT_LIB_EXT1__
#include "historic_data.hpp"
#include "util/utils.hpp"

#include <csv.hpp>
#include <mutex>
#include <ctime>
#include <iomanip>

#define ASSERT_FILE() std::unique_lock lock(mtx); \
                        if (!file) return

std::unique_ptr<markusjx::csv_file> file = nullptr;
static std::mutex mtx;

std::string get_current_time() {
    time_t cur_time = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
    struct tm buf{};
    localtime_s(&buf, &cur_time);
    std::stringstream ss;
    ss << std::put_time(&buf, "%a %b %d %H:%M:%S %Y");
    return ss.str();
}

void markusjx::autobet::historic_data::init() {
    std::unique_lock lock(mtx);
    if (!file) {
        file = std::make_unique<markusjx::csv_file>(utils::get_or_create_documents_folder() + "\\stats.csv");
        if (file->empty()) {
            file->push("sep=;").endline();
        }
    }
}

void markusjx::autobet::historic_data::start_betting() {
    ASSERT_FILE();
    *file << "Run started on:" << get_current_time() << std::endl;
    *file << "Horse #1" << "Horse #2" << "Horse #3" << "Horse #4" << "Horse #5" << "Horse #6";
    *file << "Bet placed on" << "Won" << "Winner" << "Second place" << "Third place" << "Payout/Loss" << std::endl;
}

bool markusjx::autobet::historic_data::should_save() {
    return file.operator bool();
}

void markusjx::autobet::historic_data::save_odds(const std::vector<std::string> &odds) {
    ASSERT_FILE();
    for (const auto &o: odds) {
        file->push(o);
    }
}

void markusjx::autobet::historic_data::save_bet_placed_on(short pos) {
    ASSERT_FILE();
    if (pos == -1) {
        file->push(file->at(file->size() - 1)[0]);
        file->at(file->size() - 1)[8] = -100;
    } else if (pos == -2) {
        file->push("error");
    } else {
        file->push(file->at(file->size() - 1)[pos]);
        file->at(file->size() - 1)[8] = -10000;
    }
}

void markusjx::autobet::historic_data::save_winnings(int winnings) {
    ASSERT_FILE();
    file->at(file->size() - 1)[7] = winnings > 0;
    file->at(file->size() - 1)[11] = winnings;

    file->endline();
}

void markusjx::autobet::historic_data::save_winning_odds(const std::string &o1, const std::string &o2,
                                                         const std::string &o3) {
    ASSERT_FILE();
    file->at(file->size() - 1)[8] = o1;
    file->at(file->size() - 1)[9] = o2;
    file->at(file->size() - 1)[10] = o3;
}

void markusjx::autobet::historic_data::close() {
    std::unique_lock lock(mtx);
    if (file) file->flush();
    file.reset();
}