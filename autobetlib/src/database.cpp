#include "database.hpp"
#include "util/utils.hpp"
#include "logger.hpp"

#define DATABASE_FILE "\\autobet.db3"

using namespace markusjx;

autobet::database::database() {
    const std::string db_file = utils::get_or_create_documents_folder() + DATABASE_FILE;
    this->db = std::make_unique<SQLite::Database>(db_file, SQLite::OPEN_READWRITE | SQLite::OPEN_CREATE);

    db->exec("create table if not exists notification_subscribers ("
             "id integer primary key autoincrement not null, "
             "subscriber varchar(64) not null, "
             "p256dh varchar(512) not null, "
             "auth varchar(64) not null, "
             "endpoint varchar(1024) not null"
             ")");
}

void autobet::database::insert_subscriber(const push_notification_subscriber &subscriber) {
    SQLite::Transaction transaction(*db);
    SQLite::Statement stmt(*db, "insert into notification_subscribers ("
                                "subscriber, p256dh, auth, endpoint"
                                ") values ("
                                "?, ?, ?, ?"
                                ")");

    stmt.bindNoCopy(1, subscriber.subscriber);
    stmt.bindNoCopy(2, subscriber.p256pdh);
    stmt.bindNoCopy(3, subscriber.auth);
    stmt.bindNoCopy(4, subscriber.endpoint);

    stmt.exec();
    transaction.commit();
}

std::vector<markusjx::autobet::push_notification_subscriber> autobet::database::get_all_subscribers() {
    std::vector<push_notification_subscriber> res;
    SQLite::Statement query(*db, "select id, subscriber, p256h, auth, endpoint from notification_subscribers");

    while (query.executeStep()) {
        res.emplace_back(query.getColumn(1), query.getColumn(2), query.getColumn(3), query.getColumn(4),
                         query.getColumn(5));
    }

    return res;
}

void autobet::database::delete_subscriber_by_id(int64_t id) {
    logger::StaticLogger::debugStream() << "Deleting subscriber with id " << id;
    SQLite::Transaction transaction(*db);
    SQLite::Statement stmt(*db, "delete from notification_subscribers where id = ?");

    stmt.bind(1, id);
    stmt.exec();
    transaction.commit();
}
