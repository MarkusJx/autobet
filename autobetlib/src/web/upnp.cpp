#include <upnp.h>
#include <iostream>
#include <boost/asio/ip/udp.hpp>

#include "storage/settings.hpp"
#include "web/upnp.hpp"
#include "logger.hpp"

#undef error

using namespace markusjx::autobet;

void add_port_mapping(::upnp::igd &igd, uint16_t ext_p, uint16_t int_p, const std::chrono::seconds &validity,
                      const ::upnp::net::yield_context &yield) {
    logger::StaticLogger::debugStream() << "Adding port mapping: " << ext_p << " -> " << int_p;

    auto r = igd.add_port_mapping(::upnp::igd::tcp, ext_p, int_p, "Autobet", validity, yield);
    if (r) {
        logger::StaticLogger::debug("Successfully added the mapping");
    } else {
        logger::StaticLogger::errorStream() << "Could not add the mapping: " << r.error();
    }
}

void delete_port_mapping(upnp::igd &igd, uint16_t port, const ::upnp::net::yield_context &yield) {
    logger::StaticLogger::debugStream() << "Removing port mapping: " << port;
    auto r = igd.delete_port_mapping(::upnp::igd::tcp, port, yield);
    if (r) {
        logger::StaticLogger::debug("Successfully removed the mapping");
    } else {
        logger::StaticLogger::errorStream() << "Could not remove the mapping: " << r.error();
    }
}

void web::upnp::add_port_mappings() {
    ::upnp::net::io_context ctx;
    ::upnp::net::spawn(ctx, [&](const ::upnp::net::yield_context &yield) {
        for (auto &igd: this->get_gateways(ctx, yield)) {
            logger::StaticLogger::debugStream() << "Opening port on IGD: " << igd.friendly_name();

            add_port_mapping(igd, port, port, validity, yield);
            add_port_mapping(igd, websocket_port, websocket_port, validity, yield);
        }
    });

    ctx.run();
}

void web::upnp::delete_port_mappings() {
    ::upnp::net::io_context ctx;
    ::upnp::net::spawn(ctx, [&](::upnp::net::yield_context yield) {
        for (auto &igd: this->get_gateways(ctx, yield)) {
            logger::StaticLogger::debugStream() << "Closing port on IGD: " << igd.friendly_name();

            delete_port_mapping(igd, port, yield);
            delete_port_mapping(igd, websocket_port, yield);
        }
    });

    ctx.run();
}

std::vector<::upnp::igd>
web::upnp::get_gateways(::upnp::net::io_context &ctx, const ::upnp::net::yield_context &yield) {
    logger::StaticLogger::debug("Discovering Internet Gateway Devices");

    using namespace boost::asio;
    const ip::address_v4 address = ip.empty() ? ip::address_v4::any() : ip::make_address_v4(ip);

    auto gateways_res = ::upnp::igd::discover(ctx.get_executor(), address, yield);
    if (gateways_res) {
        logger::StaticLogger::debugStream() << "Found " << gateways_res.value().size() << " gateways";
    } else {
        throw std::runtime_error(gateways_res.error().message());
    }

    return std::move(gateways_res.value());
}