#ifndef OPENCV_LINK_HPP
#define OPENCV_LINK_HPP

#include <vector>
#include <string>
#include <opencv2/ml.hpp>

/**
 * A byte
 */
using byte = unsigned char;

/**
 * A namespace for opencv-related stuff
 */
namespace opencv_link {
    /**
     * Get the opencv version this is using
     * 
     * @return the opencv version string
     */
    std::string getOpenCvVersion();

    /**
     * A class for finding the k-nearest neighbor
     */
    class knn {
    public:
        /**
         * Create a useless knn instance
         */
        knn(std::nullptr_t) noexcept;

        /**
         * Load the KNN model
         */
        explicit knn(const std::string &modelPath);

        /**
         * Predict an image
         * 
         * @param image the image to predict
         * @param scale the scale of the image compared to the training images
         * @return the prediction as a string
         */
        [[nodiscard]] std::string
        predict(const std::vector<byte> &image, double scaleX = 1.0, double scaleY = 1.0) const;

        /**
         * Predict an image
         * 
         * @param mat the mat oh the image to predict
         * @param scale the scale of the image compared to the training images
         * @return the prediction as a string
         */
        [[nodiscard]] std::string predict(const cv::Mat &mat, double scaleX = 1.0, double scaleY = 1.0) const;

        /**
         * Check if knn was initialized
         *
         * @return true, if it was initialized
         */
        [[nodiscard]] operator bool() const;

        /**
         * Reset this knn instance
         */
        void reset();

        /**
         * Free all ressources
         */
        ~knn();

        /**
         * Check if a prediction is a valid prediction for a winning.
         * Valid winnings have the form +[1-9][0-9]* or are equals to "0".
         *
         * @param pred the prediction made by knn
         * @return true, if the prediction is valid
         */
        static bool isWinning(const std::string &pred);

        /**
         * Check if a prediction is a valid prediction for an Odd.
         * Valid odds have the form [2-31]/1.
         *
         * @param pred the prediciton made by knn
         * @return true, if the prediciton is valid
         */
        static bool isOdd(const std::string &pred);

        /**
         * Convert a winning prediction to an actual integer.
         * Throws an std::runtime_error when the prediction is no winning or
         * when the prediction could not be parsed.
         *
         * @param pred the prediciton
         * @return the prediciton as an integer
         */
        static int winningToInt(const std::string &pred);

        /**
         * Convert an odd prediciton to a short.
         * Outputs 1 for 'evens' and removes the '/1' part from every other
         * odd, e.g. '2/1' -> 2 or '17/1' -> 17.
         *
         * @param pred the prediction
         * @return the odd as a short
         */
        static short oddToShort(const std::string &pred);

    private:
        cv::Ptr<cv::ml::KNearest> k_nearest;
    };
} // namespace opencv_link

#endif //OPENCV_LINK_HPP