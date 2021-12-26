#include <boost/asio.hpp>

#include "util/iputil.hpp"

std::string markusjx::autobet::iputil::get_ip() {
    using namespace boost::asio::ip;
    boost::asio::io_service netService;
    udp::resolver resolver(netService);
    udp::resolver::query query(udp::v4(), "google.com", "");
    udp::resolver::iterator endpoints = resolver.resolve(query);
    udp::endpoint ep = *endpoints;
    udp::socket sock(netService);
    sock.connect(ep);
    boost::asio::ip::address address = sock.local_endpoint().address();

    return address.to_string();
}