#include "opencv_link.hpp"

#include <opencv2/core.hpp>
#include <opencv2/ml.hpp>
#include <opencv2/imgcodecs.hpp>
#include <opencv2/imgproc.hpp>

#include <map>
#include <regex>
#include <filesystem>

#define SHOW_IMAGES 0

#if SHOW_IMAGES
#   pragma message("INFO: Building with imshow enabled")
#   include <opencv2/highgui.hpp>
#endif

/**
 * Convert a map to a string
 * 
 * @param m the map to convert
 * @returns the map values as a string
 */
static std::string mapToString(const std::map<int, char> &m) {
    // Create a string the size of m
    std::string res(m.size(), 0);

    // We will need a counter for this
    int i = 0;
    for (const auto &p : m) {
        // Insert the character into the string
        res[i++] = p.second;
    }

    return res;
}

/**
 * Check if image colums were visited and mark them visited if not.
 * If any column between x1 and x2 was already visited 'true' is returned
 * and no changes are made to visited. If no column was already visited,
 * 'false' is returned and all indices between x1 and x2 are set to 'true'.
 * 
 * @param visited the data vector
 * @param x1 the first column to visit
 * @param x2 the last column to visit
 * @return true, if any column was already visited, false if no column was already visited
 */
static bool markVisited(std::vector<bool> &visited, int x1, int x2) {
    int v = 0;
    // Check if any column was already visited
    for (int i = x1; i < x2; i++) {
        // If more than 10 columns were already visited, return true
        if (visited[i] && v++ >= 10) {
            return true;
        }
    }

    // Mark all visited columns visited
    for (int i = x1; i < x2; i++) {
        visited[i] = true;
    }

    // No column was already visited, return false
    return false;
}

std::string opencv_link::getOpenCvVersion() {
    return std::string(CV_VERSION);
}

opencv_link::knn::knn(std::nullptr_t) noexcept: k_nearest(nullptr) {}

opencv_link::knn::knn(const std::string &modelPath) {
    // Check if the model already exists
    if (std::filesystem::exists(modelPath)) {
        // Load the model
        k_nearest = cv::ml::KNearest::load(modelPath);
    } else {
        // The model does not exist, throw an exception
        throw std::runtime_error("The given model does not exist");
    }
}

std::string opencv_link::knn::predict(const std::vector<byte> &image, double scaleX, double scaleY) const {
    // Create a data mat with the image data
    cv::Mat data_mat(image, true);

    // Decode the image, convert it to grayscale and store it in a mat
    cv::Mat gray(cv::imdecode(data_mat, 0));
    return this->predict(gray, scaleX, scaleY);
}

std::string opencv_link::knn::predict(const cv::Mat &m, double scaleX, double scaleY) const {
    cv::Mat blur, thresh, gray, img_blur;

    // Calculate scale^-1, clone m and upscale the cloned map
    const double scale_inverted_x = 1.0 / scaleX;
    const double scale_inverted_y = 1.0 / scaleY;
    cv::Mat m_cpy = m.clone();

    // Upscale the image
    cv::resize(m_cpy, m_cpy, {0, 0}, scale_inverted_x, scale_inverted_y);

    // Sharpen the image
    cv::GaussianBlur(m_cpy, img_blur, {3, 3}, 0);
    cv::addWeighted(m_cpy, 1.5, img_blur, -0.5, 16, m_cpy);

    // Convert to grayscale and apply blur
    cv::cvtColor(m_cpy, gray, cv::COLOR_BGR2GRAY);
    cv::GaussianBlur(gray, blur, {3, 3}, 2);

    // Apply adaptive threshold
    cv::adaptiveThreshold(blur, thresh, 255, 1, 1, 11, 2);

    // Find contours
    std::vector<std::vector<cv::Point>> contours;
    std::vector<cv::Vec4i> hierarchy;
    cv::findContours(thresh, contours, hierarchy, cv::RETR_LIST, cv::CHAIN_APPROX_SIMPLE);

    // The result data. Will contain the predicted string
    std::map<int, char> data;

    // A vector containing indices of all columns
    std::vector<bool> visited(gray.cols, false);

    for (const std::vector<cv::Point> &cnt : contours) {
        if (cv::contourArea(cnt) > 50) {
            cv::Rect rect = cv::boundingRect(cnt);
            if (rect.height > 28 && rect.width < 28 && rect.width > 9) {
                // If this area already has been visited, skip this contour
                if (markVisited(visited, rect.x, rect.x + rect.width)) continue;

#if SHOW_IMAGES
                cv::rectangle(m_cpy, {rect.x, rect.y}, {rect.x + rect.width, rect.y + rect.height}, {0, 255, 0}, 1);
#endif //SHOW_IMAGES

                // Create a cropped version of thresh only containing a single character
                cv::Mat roi_small = thresh(rect);
                cv::resize(roi_small, roi_small, {10, 10});
                roi_small = roi_small.reshape(1, 100).t();
                roi_small.convertTo(roi_small, CV_32F);

                // Find the kNearest to roi_small
                cv::Mat results;
                k_nearest->findNearest(roi_small, 1, results);
                data.insert(std::pair<int, char>(rect.x, results.at<float>(0)));
            }
        }
    }

#if SHOW_IMAGES
    cv::imshow("img", m_cpy);
    cv::waitKey(0);
#endif //SHOW_IMAGES

    // Store all values in a string. This is easy as the map is always sorted
    return mapToString(data);
}

opencv_link::knn::operator bool() const {
    return k_nearest.operator bool();
}

void opencv_link::knn::reset() {
    k_nearest.reset();
}

opencv_link::knn::~knn() = default;

bool opencv_link::knn::isWinning(const std::string &pred) {
    // Matches every number with a prefix of "+" or matches a single "0"
    static const std::regex winning_regex("^0|(\\+[1-9][0-9]*)$");
    return std::regex_match(pred, winning_regex);
}

bool opencv_link::knn::isOdd(const std::string &pred) {
    // Regex matches everything between 2/1 and 31/1 or matches "evens"
    static const std::regex odd_regex("^(([2-9]|([1-2][0-9])|(3[0-1]))\\/1)|(evens)$");
    return std::regex_match(pred, odd_regex);
}

int opencv_link::knn::winningToInt(const std::string &pred) {
    // If the prediction is no winning, throw
    if (!isWinning(pred)) {
        throw std::runtime_error("The given prediction is no winning");
    }

    // Set the out pointer and errno
    char *out = nullptr;
    errno = 0;

    // Get the result strich and check for errors
    int res = (int) std::strtol(pred.c_str(), &out, 10);
    if ((out != nullptr && std::strlen(out) > 0) || res < 0 || errno == ERANGE) {
        throw std::runtime_error("The prediction could not be parsed");
    }

    return res;
}

short opencv_link::knn::oddToShort(const std::string &pred) {
    if (!isOdd(pred)) {
        throw std::runtime_error("The given prediction is no odd");
    }

    if (pred == "evens") {
        return 1;
    } else {
        size_t slash = pred.find_first_of('/');
        if (slash == std::string::npos) {
            throw std::runtime_error("Could not find a slash");
        }

        std::string number = pred.substr(0, slash);

        // Set the out pointer and errno
        char *out = nullptr;
        errno = 0;

        // Get the result number and check for errors
        short res = (short) std::strtol(number.c_str(), &out, 10);
        if ((out != nullptr && std::strlen(out) > 0) || res < 0 || errno == ERANGE) {
            throw std::runtime_error("The prediction could not be parsed");
        }

        return res;
    }
}