#ifndef AUTOBETLIB_DATABASE_HPP
#define AUTOBETLIB_DATABASE_HPP

#include <memory>
#include <vector>
#include <SQLiteCpp/SQLiteCpp.h>

#include "objects/push_notification_subscriber.hpp"

namespace markusjx::autobet {
    class database {
    public:
        database();

        void insert_subscriber(const push_notification_subscriber &subscriber);

        std::vector<push_notification_subscriber> get_all_subscribers();

        void delete_subscriber_by_id(int64_t id);

    private:
        std::unique_ptr<SQLite::Database> db;
    };
}

#endif //AUTOBETLIB_DATABASE_HPP
