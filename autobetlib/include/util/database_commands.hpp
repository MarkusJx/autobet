#ifndef AUTOBETLIB_DATABASE_COMMANDS_HPP
#define AUTOBETLIB_DATABASE_COMMANDS_HPP

const char *CREATE_TABLE_NOTIFICATION_SUBSCRIBERS = R"(
create table if not exists notification_subscribers (
    id integer primary key autoincrement not null,
    subscriber varchar(64) not null,
    p256dh varchar(512) not null,
    auth varchar(64) not null,
    endpoint varchar(1024) not null
)
)";

const char *INSERT_INTO_NOTIFICATION_SUBSCRIBERS = R"(
insert into notification_subscribers (
    subscriber, p256dh, auth, endpoint
) values (
    ?, ?, ?, ?
)
)";

const char *SELECT_ALL_NOTIFICATION_SUBSCRIBERS = R"(
select
    id, subscriber, p256dh, auth, endpoint
from
    notification_subscribers
)";

const char *DELETE_NOTIFICATION_SUBSCRIBER_BY_ID = R"(
delete from
    notification_subscribers
where
    id = ?
)";

const char *DELETE_NOTIFICATION_SUBSCRIBER_BY_CONTENTS = R"(
delete from
    notification_subscribers
where
    subscriber = ? and
    p256dh = ? and
    auth = ? and
    endpoint = ?
)";

#endif //AUTOBETLIB_DATABASE_COMMANDS_HPP
