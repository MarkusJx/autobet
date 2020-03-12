set(CMAKE_LEGACY_CYGWIN_WIN32 0)
project(GTA-Online-Autobet-Dev)
CMAKE_MINIMUM_REQUIRED(VERSION 3.15)

set(CMAKE_CXX_STANDARD 20)

option(DISABLE_UPDATER "Disable Updater" FALSE)
option(DISABLE_FULL_DEBUG "Disable support for --debug:full commandline argument" FALSE)
option(GHBuild "Build from github actions" FALSE)
option(BUILD_CPPJSLIB FALSE)

if (NOT DISABLE_FULL_DEBUG)
    add_compile_definitions(AUTOBET_ENABLE_FULL_DEBUG)
    message(STATUS "Building with debug:full support")

    file(GLOB zip
            "zip/*.h"
            "zip/*.c"
            )
else ()
    message(STATUS "Building without debug:full support")
endif ()

if (GHBuild)
    message(STATUS "Building on GitHub actions")
endif ()

if (NOT DISABLE_UPDATER)
    if (NOT GHBuild)
        include_directories("C:\\Program Files\\OpenSSL-Win64\\include")
        set(ssllib "C:\\Program Files\\OpenSSL-Win64\\lib")
    endif ()
    add_compile_definitions(AUTOBET_BUILD_UPDATER)
    message(STATUS "Building with updater enabled")
else ()
    message(STATUS "Building with updater disabled")
endif ()

include_directories(${CMAKE_SOURCE_DIR}/include)
link_directories(${CMAKE_SOURCE_DIR}/lib ${Boost_LIBRARY_DIRS})

file(GLOB src
        "*.hpp"
        "*.cpp"
        )

file(GLOB updater
        "updater/*.hpp"
        "updater/*.cpp"
        )

add_executable(Autobet "${src}" "${updater}" "${include}" "${zip}" "${cef}")

if (${CMAKE_BUILD_TYPE} STREQUAL "Debug" OR ${CMAKE_BUILD_TYPE} STREQUAL "RelWithDebInfo")
    message(STATUS "Building with debug infos")
    target_link_libraries(Autobet ai.dll.if)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} /STACK:10000000")
else ()
    message(STATUS "Building in release mode")
    target_link_libraries(Autobet ai-release.dll.if)
endif ()

#if (WIN32 AND ${CMAKE_BUILD_TYPE} STREQUAL "Release")
    #target_link_options(Autobet PRIVATE "/SUBSYSTEM:WINDOWS" "/ENTRY:mainCRTStartup")
    #target_compile_options(Autobet PRIVATE "/O2")
#endif ()

if (BUILD_CPPJSLIB)
    include(CppJsLib/InitCppJsLib.cmake)
    initCppJsLib(Autobet "CppJsLib" "${CMAKE_SOURCE_DIR}/include" TRUE TRUE)

    add_compile_definitions(BUILD_CPPJSLIB)
else ()
    target_link_libraries(Autobet CppJsLib)
endif ()


if (NOT DISABLE_UPDATER)
    if (GHBuild)
        target_link_libraries(Autobet libsslMD libcryptoMD)
    else ()
        target_link_libraries(Autobet "${ssllib}/libssl.lib" "${ssllib}/libcrypto.lib")
    endif ()
endif ()