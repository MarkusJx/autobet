#ifndef AUTOBETLIB_UPNP_HPP
#define AUTOBETLIB_UPNP_HPP

#include <string>
#include <upnp.h>

namespace markusjx::autobet::web {
    /**
     * A class for exposing ports via UPnP
     */
    class upnp {
    public:
        /**
         * Create a new upnp instance
         *
         * @param _ip the ip to bind the socket to
         * @param _port the port to expose
         * @param _websocket_port the websocket port to expose
         * @param _validity the time the mapping should be valid
         */
        template<class Rep, class Period>
        upnp(std::string _ip, uint16_t _port, uint16_t _websocket_port,
             const std::chrono::duration<Rep, Period> &_validity) :
                port(_port), websocket_port(_websocket_port), ip(std::move(_ip)),
                validity(std::chrono::duration_cast<std::chrono::seconds>(_validity)) {}

        /**
         * Add the required port mappings
         */
        void add_port_mappings();

        /**
         * Delete the port mappings created earlier
         */
        void delete_port_mappings();

    private:
        /// The mapping's validity
        std::chrono::seconds validity;
        /// The exposed port
        uint16_t port;
        /// The exposed websocket port
        uint16_t websocket_port;
        /// The ip to bind to
        std::string ip;

        /**
         * Get the internet gateway devices
         *
         * @return the IGDs
         */
        std::vector<::upnp::igd> get_gateways(::upnp::net::io_context &ctx, const ::upnp::net::yield_context &yield);
    };
}

#endif //AUTOBETLIB_UPNP_HPP
