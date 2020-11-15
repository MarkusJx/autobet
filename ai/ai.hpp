#ifndef AI_DLL_H
#define AI_DLL_H

#ifndef TF_AI_EXPORT
#   ifndef __LINUX__
#       ifdef BUILD_TF_AI
#           define TF_AI_EXPORT __declspec(dllexport)
#       else
#           define TF_AI_EXPORT __declspec(dllimport)
#       endif //defined BUILD_TF_AI
#   else
#       define TF_AI_EXPORT
#   endif //Linux
#endif //defined TF_AI_EXPORT

/**
 * The tensorflow namespace
 */
namespace tf
{
    /**
     * The status of an ai
     */
    class AiStatus {
    public:
        /**
         * Constructor of AiStatus. Will not be exported.
         */
        AiStatus();

        /**
         * Check if everything is ok
         * 
         * @return true, if everything is ok
         */
        TF_AI_EXPORT bool ok() const noexcept;

        /**
         * Get the last status message or an empty string if none exists
         * 
         * @return the last status message
         */
        TF_AI_EXPORT const char *getLastStatus() const noexcept;

        /**
         * Reset the last status message. Sets the last status to an empty string and 
         * ok to true
         */
        TF_AI_EXPORT void resetLastStatus();

        /**
         * Destructor of AiStatus. Will not be exported.
         */
        ~AiStatus();

        /**
         * Set an error. Will not be exported
         * 
         * @param status the error message
         */
        void setError(const char *status);

    private:
        bool _ok;
        char *lastStatus;
    };

    /**
     * A struct for storing information about an label array
     */
    typedef struct labels_s {
        const short *labels; // The label array
        unsigned int labels_size; // The size of the label array
    } labels;

    /**
     * The AI class
     */
    class AI {
    public:
        /**
         * Get the tensorflow version this was compiled with
         * 
         * @return the tensorflow version string in the form 'MAJOR.MINOR.PATCH'
         */
        TF_AI_EXPORT static const char *getTFVersion();

        /**
         * Create a new ai instance. Must be deleted using destroy(1).
         * 
         * @param modelPath the path to the model to load (*.pb file).
         * @param l a label struct containing information about the labels
         * @return a new instance of the AI class
         */
        TF_AI_EXPORT static AI *create(const char *modelPath, labels l);

        /**
         * Predict an image
         * 
         * @param image the image to predict
         * @param size the size of the image
         * @return the prediction or -1 if an error occurred
         */
        TF_AI_EXPORT short predict(char *image, size_t size);

        /**
         * Get the ais status
         * 
         * @return the AiStatus instance to get the status from
         */
        TF_AI_EXPORT AiStatus *getStatus() const noexcept;

        /**
         * Destroy an AI class instance created using create(2).
         * 
         * @param toDestroy the instance to delete
         */
        TF_AI_EXPORT static void destroy(AI *toDestroy);

    private:
        TF_AI_EXPORT AI(const char *, labels);

        TF_AI_EXPORT ~AI();

        const short *labels;
        unsigned int labels_size;
        AiStatus *status;
        void *ai;
    };
} // namespace tf

#endif //AI_DLL_H