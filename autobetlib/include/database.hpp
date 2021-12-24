#ifndef AUTOBETLIB_DATABASE_HPP
#define AUTOBETLIB_DATABASE_HPP

#include <vector>
#include <SQLiteCpp/SQLiteCpp.h>

#include "objects/push_notification_subscriber.hpp"

namespace markusjx::autobet {
    class database {
    public:
        database();

        void insert(const objects::push_notification_subscriber &subscriber);

        std::vector<objects::push_notification_subscriber> get_all_subscribers();

        void delete_subscriber_by_id(int64_t id);

    private:
        SQLite::Database db;
    };
}

#endif //AUTOBETLIB_DATABASE_HPP
