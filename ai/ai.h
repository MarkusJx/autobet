#ifndef AI_DLL_H
#define AI_DLL_H

#ifndef TF_AI_EXPORT
#ifndef __LINUX__
#ifdef BUILD_TF_AI
#define TF_AI_EXPORT __declspec(dllexport)
#else
#define TF_AI_EXPORT __declspec(dllimport)
#endif
#else
#define TF_AI_EXPORT
#endif
#endif

/**
 * The tensorflow namespace
 */
namespace tf {
    /**
     * Set a file prefix for the ai models
     *
     * @param prefix the prefix
     */
    TF_AI_EXPORT void setPrefix(const char *prefix);

    /**
     * The betting ai
     */
    class BettingAI {
    public:
        /**
         * Create an instance of the ai
         *
         * @return true, if the operation was successful, false if no memory is available
         */
        TF_AI_EXPORT static bool create();

        /**
         * Check if the ai has been initialized
         *
         * @return true, if the ai has been initialized
         */
        TF_AI_EXPORT static bool initialized();

        /**
         * Predict an image
         *
         * @param image the image data
         * @param size the size of the data
         * @return the prediction
         */
        TF_AI_EXPORT static short predict(char *image, size_t size);

        /**
         * Self-test the ai
         *
         * @param fileName the file to test with
         * @return the prediction
         */
        TF_AI_EXPORT static short selfTest(const char *fileName);

        /**
         * Destroy the instance of the ai
         */
        TF_AI_EXPORT static void destroy();

        /**
         * The status of the ai
         */
        class status {
        public:
            /**
             * Check if everything is ok
             *
             * @return true, if everything is ok
             */
            TF_AI_EXPORT static bool ok();

            /**
             * Get the last status
             *
             * @return the last status
             */
            TF_AI_EXPORT static const char *getLastStatus();

            /**
             * Reset the status of the ai
             */
            TF_AI_EXPORT static void resetLastStatus();
        };
    };

    /**
     * The winnings ai
     */
    class WinningsAI {
    public:
        /**
         * Create an instance of the ai
         *
         * @return true, if the operation was successful, false if no memory is available
         */
        TF_AI_EXPORT static bool create();

        /**
         * Check if the ai has been initialized
         *
         * @return true, if the ai has been initialized
         */
        TF_AI_EXPORT static bool initialized();

        /**
         * Predict an image
         *
         * @param image the image data
         * @param size the size of the data
         * @return the prediction
         */
        TF_AI_EXPORT static short predict(char *image, size_t size);

        /**
         * Self-test the ai
         *
         * @param fileName the file to test with
         * @return the prediction
         */
        TF_AI_EXPORT static short selfTest(const char *fileName);

        /**
         * Destroy the instance of the ai
         */
        TF_AI_EXPORT static void destroy();

        /**
         * The status of the ai
         */
        class status {
        public:
            /**
             * Check if everything is ok
             *
             * @return true, if everything is ok
             */
            TF_AI_EXPORT static bool ok();

            /**
             * Get the last status
             *
             * @return the last status
             */
            TF_AI_EXPORT static const char *getLastStatus();

            /**
             * Reset the status of the ai
             */
            TF_AI_EXPORT static void resetLastStatus();
        };
    };
}  // namespace tf

#endif