#ifndef AUTOBETLIB_UPNP_HPP
#define AUTOBETLIB_UPNP_HPP

#include <string>

namespace markusjx::autobet::web::upnp {
    void expose_ports(const std::string &ip, uint16_t port, uint16_t websocket_port);

    void remove_ports(const std::string &ip, uint16_t port, uint16_t websocket_port);
}

#endif //AUTOBETLIB_UPNP_HPP
