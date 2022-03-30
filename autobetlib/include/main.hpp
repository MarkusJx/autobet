#ifndef GTA_ONLINE_AUTOBET_DEV_MAIN_HPP
#define GTA_ONLINE_AUTOBET_DEV_MAIN_HPP

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32) && !defined(__CYGWIN__)
#   define AUTOBET_WINDOWS
#else
#   undef AUTOBET_WINDOWS
#   define AUTOBET_LINUX
#endif

#include <string>

#define _AUTOBET_STR(x) #x
#define AUTOBET_STR(x) _AUTOBET_STR(x)
#define TODO(msg) "TODO: " _AUTOBET_STR(msg) ": " __FILE__ ":" AUTOBET_STR(__LINE__)

#define AUTOBET_UNUSED [[maybe_unused]]

#endif //GTA_ONLINE_AUTOBET_DEV_MAIN_HPP
