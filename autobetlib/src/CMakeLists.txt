project(autobetLib CXX)
CMAKE_MINIMUM_REQUIRED(VERSION 3.15)

set(CMAKE_CXX_STANDARD 20)

include_directories(${CMAKE_JS_INC})
add_compile_definitions(NAPI_CPP_EXCEPTIONS)

message(STATUS "Building with debug:full support")

include(autobetLib_func_def.cmake)
include(${CMAKE_SOURCE_DIR}/conanbuildinfo.cmake)
conan_basic_setup()

# Download the zip repo
downloadZip()
set(ZIP_SOURCE_DIRECTORY ${CMAKE_SOURCE_DIR}/src/zip/src)

file(GLOB zip
        "${ZIP_SOURCE_DIRECTORY}/*.h"
        "${ZIP_SOURCE_DIRECTORY}/*.c"
        )

# Add sources
file(GLOB src
        "*.hpp"
        "*.cpp"
        )

set(OPENCV_LINK_SRC opencv_link/opencv_link.cpp opencv_link/opencv_link.hpp)
set(NAPI_TOOLS_SRC n_api/napi_tools.hpp)

# Add the library
add_library(${PROJECT_NAME} SHARED ${src} ${include} ${zip} ${OPENCV_LINK_SRC} ${NAPI_TOOLS_SRC} ${CMAKE_JS_SRC})

# n-api stuff
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${CONAN_LIBS})

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
    set(CMAKE_EXE_LINKER_FLAGS "${CMAKE_EXE_LINKER_FLAGS} /STACK:10000000")
else ()
    message(STATUS "Building in release mode")
endif ()

set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W4")

# NOTE: This option is required when building a debug build (debug/relWithDebInfo)
#set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /bigobj")

add_compile_definitions(CPPJSLIB_ENABLE_WEBSOCKET)
