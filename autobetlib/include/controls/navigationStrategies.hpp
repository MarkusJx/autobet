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

    private:
        // A GameController instance
        controller::GameController impl;

        static const uint16_t controllerClicks[6];
    };
}

#endif //AUTOBETLIB_NAVIGATION_STRATEGY_HPP
