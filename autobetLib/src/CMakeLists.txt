project(autobetLib CXX)
CMAKE_MINIMUM_REQUIRED(VERSION 3.15)

set(CMAKE_CXX_STANDARD 20)

include_directories(${CMAKE_JS_INC})
add_compile_definitions(NAPI_CPP_EXCEPTIONS)

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
link_directories(${CMAKE_SOURCE_DIR}/lib ${Boost_LIBRARY_DIRS} "C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Tools\\MSVC\\14.27.29110\\atlmfc\\lib\\x64")

file(GLOB src
        "*.hpp"
        "*.cpp"
        )

add_library(${PROJECT_NAME} SHARED ${src} ${include} ${zip} ${CMAKE_JS_SRC})

# Link against vXboxInterface for controller simulation
target_link_libraries(${PROJECT_NAME} vXboxInterface)

# n-api stuff
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})

# Include N-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME} PRIVATE ${NODE_ADDON_API_DIR})

# define NAPI_VERSION
add_definitions(-DNAPI_VERSION=4)

if (${CMAKE_BUILD_TYPE} STREQUAL "Debug" OR ${CMAKE_BUILD_TYPE} STREQUAL "RelWithDebInfo")
    message(STATUS "Building with debug infos")
    target_link_libraries(${PROJECT_NAME} ai.dll.if)
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} /STACK:10000000")
else ()
    message(STATUS "Building in release mode")
    target_link_libraries(${PROJECT_NAME} ai-release.dll.if)
endif ()

if (BUILD_CPPJSLIB)
    include(CppJsLib/InitCppJsLib.cmake)
    initCppJsLib(${PROJECT_NAME} "CppJsLib" "${CMAKE_SOURCE_DIR}/include" TRUE TRUE)

    add_compile_definitions(BUILD_CPPJSLIB)
else ()
    target_link_libraries(${PROJECT_NAME} CppJsLib)
endif ()


if (NOT DISABLE_UPDATER)
    if (GHBuild)
        target_link_libraries(${PROJECT_NAME} libsslMD libcryptoMD)
    else ()
        target_link_libraries(${PROJECT_NAME} "${ssllib}/libssl.lib" "${ssllib}/libcrypto.lib")
    endif ()
endif ()