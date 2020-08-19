#ifndef GTA_ONLINE_AUTOBET_DEV_MAIN_HPP
#define GTA_ONLINE_AUTOBET_DEV_MAIN_HPP

#if defined(WIN32) || defined(_WIN32) || defined(__WIN32) && !defined(__CYGWIN__)
#   define AUTOBET_WINDOWS
#else
#   undef AUTOBET_WINDOWS
#   define AUTOBET_LINUX
#endif

#endif //GTA_ONLINE_AUTOBET_DEV_MAIN_HPP
