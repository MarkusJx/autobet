#ifndef AUTOBETLIB_RECURRING_JOB_HPP
#define AUTOBETLIB_RECURRING_JOB_HPP

#include <functional>
#include <boost/thread.hpp>

namespace markusjx::autobet::util {
    /**
     * A class for executing recurring jobs
     */
    class recurring_job {
    public:
        /**
         * Create a recurring job
         *
         * @param _job the job to run
         * @param _duration the duration between the job runs
         */
        template<class Rep, class Period>
        recurring_job(std::function<void()> _job, boost::chrono::duration<Rep, Period> _duration) :
                job(std::move(_job)), duration(boost::chrono::duration_cast<boost::chrono::milliseconds>(_duration)),
                run(nullptr) {}

        /**
         * Don't
         */
        recurring_job(const recurring_job &) noexcept = delete;

        /**
         * Don't
         */
        recurring_job &operator=(const recurring_job &) noexcept = delete;

        /**
         * Start the job
         */
        void start();

        /**
         * Interrupt the runner thread and try to join it
         *
         * @param time the max amount of time to wait
         * @return true if the thread could be joined
         */
        bool try_join_for(const boost::chrono::milliseconds &time);

        /**
         * Interrupts the thread if running
         */
        ~recurring_job();

    private:
        /// The job to run
        std::function<void()> job;
        /// The time to sleep between the runs
        boost::chrono::milliseconds duration;
        /// Whether the runner should continue executing
        std::shared_ptr<std::atomic_bool> run;
        /// The runner thread
        boost::thread thread;
    };
}

#endif //AUTOBETLIB_RECURRING_JOB_HPP
