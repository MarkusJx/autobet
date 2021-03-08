#ifndef AUTOBETLIB_NAVIGATION_STRATEGY_HPP
#define AUTOBETLIB_NAVIGATION_STRATEGY_HPP

#include "controls/controller.hpp"

/**
 * A namespace for ui navigation strategies
 */
namespace uiNavigationStrategies {
    /**
     * The base class
     */
    class navigationStrategy {
    protected:
        /**
         * Create a clickStrategy instance
         */
        navigationStrategy() noexcept;

    public:
        /**
         * Don't.
         */
        navigationStrategy(const navigationStrategy &) = delete;

        /**
         * Don't.
         */
        navigationStrategy(navigationStrategy &&) = delete;

        /**
         * Get the navigation strategy by their name
         *
         * @param name
         * @return
         */
        static std::shared_ptr<navigationStrategy> fromName(const std::string &name);

        /**
         * Place a bet on a horse
         *
         * @param y the y position index where to click. Should be between -1 and 6
         */
        virtual void placeBet(short y) const = 0;

        /**
         * Go back from the winnings screen to the betting screen
         */
        virtual void reset() const = 0;

        /**
         * Skip this bet
         */
        virtual void skipBet() const = 0;

        /**
         * Optionally reset before the first bet is placed
         */
        virtual void firstBet() const;

        /**
         * Get the name of the strategy
         *
         * @return the strategy name
         */
        [[nodiscard]] virtual std::string getName() const = 0;

        /**
         * Set the time to sleep between a button is pressed and then released
         *
         * @param time the time to sleep
         */
        virtual void setClickSleep(int time) = 0;

        /**
         * Set the time to sleep after a button click
         *
         * @param time the time to sleep
         */
        virtual void setAfterClickSleep(int time) = 0;

        [[nodiscard]] int getClickSleep() const;

        [[nodiscard]] int getAfterClickSleep() const;

    protected:
        int click_sleep;
        int afterClick_sleep;
    };

    /**
     * A navigation strategy for navigating around the ui using the mouse
     */
    class mouseNavigationStrategy : public navigationStrategy {
    public:
        mouseNavigationStrategy() noexcept;

        void placeBet(short y) const override;

        void reset() const override;

        void skipBet() const override;

        [[nodiscard]] std::string getName() const override;

        void setClickSleep(int time) override;

        void setAfterClickSleep(int time) override;

    private:
        static const int afterClick_sleep_default;

        static const int click_sleep_default;
    };

    /**
     * A navigation strategy for navigating around the ui using a virtual controller
     */
    class controllerNavigationStrategy : public navigationStrategy {
    public:
        controllerNavigationStrategy();

        void placeBet(short y) const override;

        void reset() const override;

        void skipBet() const override;

        void firstBet() const override;

        [[nodiscard]] std::string getName() const override;

        void setClickSleep(int time) override;

        void setAfterClickSleep(int time) override;

    private:
        // A GameController instance
        controller::GameController impl;

        static const int afterClick_sleep_default;

        static const int click_sleep_default;

        static const uint16_t controllerClicks[6];
    };
}

#endif //AUTOBETLIB_NAVIGATION_STRATEGY_HPP
