#define __STDC_WANT_LIB_EXT1__

#include "historic_data.hpp"
#include "util/utils.hpp"
#include "variables.hpp"

#include <csv.hpp>
#include <mutex>
#include <ctime>
#include <iomanip>

#define ASSERT_FILE() std::unique_lock lock(mtx); \
                        if (!file) return

std::unique_ptr<markusjx::csv_file> file = nullptr;
static std::mutex mtx;
static unsigned int start_time = 0;
static int64_t start_winnings = 0;
static int money_spent = 0;
static int num_lost = 0;
static int num_won = 0;
static int num_skipped = 0;
static int num_placed = 0;

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
        /*if (file->empty()) {
            file->push("sep=;").endline();
        }*/
    }
}

void markusjx::autobet::historic_data::start_betting() {
    ASSERT_FILE();
    *file << "Run started on:" << get_current_time() << std::endl;
    *file << "Horse #1" << "Horse #2" << "Horse #3" << "Horse #4" << "Horse #5" << "Horse #6";
    *file << "Bet placed on" << "Won" << "Winner" << "Second place" << "Third place" << "Payout/Loss" << std::endl;

    start_time = variables::time_running;
    start_winnings = variables::winnings;
    money_spent = 0;
    num_lost = 0;
    num_won = 0;
    num_skipped = 0;
    num_placed = 0;
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
        num_skipped++;
        money_spent += 100;
    } else if (pos == -2) {
        file->push("error");
    } else {
        file->push(file->at(file->size() - 1)[pos]);
        file->at(file->size() - 1)[8] = -10000;
        money_spent += 10000;
        num_placed++;
    }
}

void markusjx::autobet::historic_data::save_winnings(int winnings) {
    ASSERT_FILE();
    file->at(file->size() - 1)[7] = winnings > 0;
    file->at(file->size() - 1)[11] = winnings;

    if (winnings > 0) {
        num_won++;
    } else {
        num_lost++;
    }

    file->endline();
}

void markusjx::autobet::historic_data::save_winning_odds(const std::string &o1, const std::string &o2,
                                                         const std::string &o3) {
    ASSERT_FILE();
    file->at(file->size() - 1)[8] = o1;
    file->at(file->size() - 1)[9] = o2;
    file->at(file->size() - 1)[10] = o3;
}

void markusjx::autobet::historic_data::betting_stopped() {
    ASSERT_FILE();
    file->endline();
    file->push("Betting stopped after " + std::to_string(variables::time_running - start_time) + " seconds").endline();
    file->push("Money spent on bets") << "Winnings this session" << "Bets lost" << "Bets won" << "Bets skipped"
                                      << "Bets placed" << std::endl;
    file->push(money_spent) << (variables::winnings - start_winnings) << num_lost << num_won << num_skipped
                            << num_placed << std::endl;
    file->endline().endline();
    file->flush();
}

void markusjx::autobet::historic_data::close() {
    std::unique_lock lock(mtx);
    if (file) file->flush();
    file.reset();
}