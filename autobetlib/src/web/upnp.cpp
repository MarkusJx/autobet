#include <upnp.h>
#include <iostream>
#include <boost/asio/ip/udp.hpp>

#include "storage/settings.hpp"
#include "web/upnp.hpp"
#include "logger.hpp"

#undef error

using namespace markusjx::autobet;

void add_port_mapping(::upnp::igd &igd, uint16_t ext_p, uint16_t int_p, ::upnp::net::yield_context yield) {
    logger::StaticLogger::debugStream() << "Adding port mapping: " << ext_p << " -> " << int_p;

    auto r = igd.add_port_mapping(::upnp::igd::tcp, ext_p, int_p, "Autobet", std::chrono::minutes(1), yield);
    if (r) {
        logger::StaticLogger::debug("Successfully added the mapping");
    } else {
        logger::StaticLogger::errorStream() << "Could not add the mapping: " << r.error();
    }
}

void delete_port_mapping(upnp::igd &igd, uint16_t port, ::upnp::net::yield_context yield) {
    logger::StaticLogger::debugStream() << "Removing port mapping: " << port;
    auto r = igd.delete_port_mapping(::upnp::igd::tcp, port, yield);
    if (r) {
        logger::StaticLogger::debug("Successfully removed the mapping");
    } else {
        logger::StaticLogger::errorStream() << "Could not remove the mapping: " << r.error();
    }
}

void
change_port_mappings(const std::string &ip, const uint16_t port, const uint16_t websocket_port, const bool expose) {
    ::upnp::net::io_context ctx;

    ::upnp::net::spawn(ctx, [&](::upnp::net::yield_context yield) {
        logger::StaticLogger::debug("Discovering Internet Gateway Devices");

        auto gateways_res = ::upnp::igd::discover(ctx.get_executor(), yield, ip);
        if (gateways_res) {
            logger::StaticLogger::debugStream() << "Found " << gateways_res.value().size() << " gateways";
        } else {
            throw std::runtime_error(gateways_res.error().message());
        }

        auto gateways = std::move(gateways_res.value());
        for (auto &igd: gateways) {
            //get_external_address(igd, yield);
            //list_port_mappings_igd1(igd, yield);
            //list_port_mappings_igd2(igd, yield);

            if (expose) {
                logger::StaticLogger::debugStream() << "Opening port on IGD: " << igd.friendly_name();

                add_port_mapping(igd, port, port, yield);
                add_port_mapping(igd, websocket_port, websocket_port, yield);
            } else {
                logger::StaticLogger::debugStream() << "Closing port on IGD: " << igd.friendly_name();

                delete_port_mapping(igd, port, yield);
                delete_port_mapping(igd, websocket_port, yield);
            }
        }
    });

    ctx.run();
}

void web::upnp::expose_ports(const std::string &ip, const uint16_t port, const uint16_t websocket_port) {
    change_port_mappings(ip, port, websocket_port, true);
}

void web::upnp::remove_ports(const std::string &ip, uint16_t port, uint16_t websocket_port) {
    change_port_mappings(ip, port, websocket_port, false);
}