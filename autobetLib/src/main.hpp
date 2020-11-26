#ifndef GTA_ONLINE_AUTOBET_DEV_MAIN_HPP
#define GTA_ONLINE_AUTOBET_DEV_MAIN_HPP

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32) && !defined(__CYGWIN__)
#   define AUTOBET_WINDOWS
#else
#   undef AUTOBET_WINDOWS
#   define AUTOBET_LINUX
#endif

#include <string>

// The current autobet version string
#define AUTOBET_VERSION "1.2.1"

#define _AUTOBET_STR(x) #x
#define AUTOBET_STR(x) _AUTOBET_STR(x)
#define TODO(msg) "TODO: " _AUTOBET_STR(msg) ": " __FILE__ ":" AUTOBET_STR(__LINE__)

/**
 * Quit the node.js process
 */
void node_quit();

/**
 * Log through the javascript process
 * 
 * @param val the value to log
 */
void node_log(const std::string &val);

#endif //GTA_ONLINE_AUTOBET_DEV_MAIN_HPP
