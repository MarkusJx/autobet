#include "database.hpp"
#include "util/utils.hpp"
#include "util/database_commands.hpp"
#include "logger.hpp"

#define DATABASE_FILE "\\autobet.sqlite"
#define DB_FILE (utils::get_or_create_documents_folder() + DATABASE_FILE)

using namespace markusjx;

autobet::database::database() : db(DB_FILE, SQLite::OPEN_READWRITE | SQLite::OPEN_CREATE) {
    db.exec(CREATE_TABLE_NOTIFICATION_SUBSCRIBERS);
}

void autobet::database::insert(const objects::push_notification_subscriber &subscriber) {
    SQLite::Transaction transaction(db);
    SQLite::Statement stmt(db, INSERT_INTO_NOTIFICATION_SUBSCRIBERS);

    stmt.bindNoCopy(1, subscriber.subscriber);
    stmt.bindNoCopy(2, subscriber.p256dh);
    stmt.bindNoCopy(3, subscriber.auth);
    stmt.bindNoCopy(4, subscriber.endpoint);

    stmt.exec();
    transaction.commit();
}

std::vector<autobet::objects::push_notification_subscriber> autobet::database::get_all_subscribers() {
    std::vector<objects::push_notification_subscriber> res;
    SQLite::Statement query(db, SELECT_ALL_NOTIFICATION_SUBSCRIBERS);

    while (query.executeStep()) {
        res.emplace_back(query.getColumn(0), query.getColumn(1), query.getColumn(2), query.getColumn(3),
                         query.getColumn(4));
    }

    return res;
}

void autobet::database::delete_subscriber_by_id(int64_t id) {
    logger::StaticLogger::debugStream() << "Deleting subscriber with id " << id;
    SQLite::Transaction transaction(db);
    SQLite::Statement stmt(db, DELETE_NOTIFICATION_SUBSCRIBER_BY_ID);

    stmt.bind(1, id);
    stmt.exec();
    transaction.commit();
}
