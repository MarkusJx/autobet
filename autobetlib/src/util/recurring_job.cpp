#include "util/recurring_job.hpp"
#include "logger.hpp"

using namespace markusjx::autobet::util;

void recurring_job::start() {
    if (run) {
        throw std::exception("The job was already started");
    } else {
        run = std::make_shared<std::atomic_bool>(true);
    }

    thread = boost::thread([job = job, duration = duration, run = run] {
        bool first_run = true;
        while (run->load(std::memory_order_acquire)) {
            try {
                if (first_run) {
                    first_run = false;
                } else {
                    job();
                }

                boost::this_thread::sleep_for(duration);
            } catch (const boost::thread_interrupted &) {
                logger::StaticLogger::debugStream() << "Thread with id " << boost::this_thread::get_id()
                                                    << " was interrupted";
                break;
            } catch (const std::exception &e) {
                logger::StaticLogger::errorStream() << "Exception thrown in thread " << boost::this_thread::get_id()
                                                    << ':' << e.what();
            }
        }
    });
}

bool recurring_job::try_join_for(const boost::chrono::milliseconds &time) {
    if (run) {
        run->store(false, std::memory_order_release);
        thread.interrupt();
        run.reset();
        return thread.try_join_for(time);
    } else {
        throw std::runtime_error("The thread is not running");
    }
}

recurring_job::~recurring_job() {
    if (run) {
        run->store(false, std::memory_order_release);
        thread.interrupt();
    }
}
