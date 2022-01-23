#ifndef AUTOBETLIB_HISTORIC_DATA_HPP
#define AUTOBETLIB_HISTORIC_DATA_HPP

#include <vector>
#include <string>

/**
 * A namespace for historic data
 */
namespace markusjx::autobet::historic_data {
    /**
     * Initialize the csv file
     */
    void init();

    void start_betting();

    /**
     * Whether historic data should be saved
     *
     * @return true if data should be saved
     */
    bool should_save();

    /**
     * Save the odds of the horses to bet on
     *
     * @param odds the odds to save
     */
    void save_odds(const std::vector<std::string> &odds);

    /**
     * Save the position of the horse the bet was placed on.
     * Pass -1 if no bet was placed or -2 if an error occurred.
     *
     * @param pos the position
     */
    void save_bet_placed_on(short pos);

    /**
     * Save the winnings
     *
     * @param winnings the winnings
     */
    void save_winnings(int winnings);

    void save_winning_odds(const std::string &o1, const std::string &o2, const std::string &o3);

    /**
     * Close the csv file
     */
    void close();
}

#endif //AUTOBETLIB_HISTORIC_DATA_HPP
