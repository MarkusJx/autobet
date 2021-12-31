project(autobetLib CXX)
CMAKE_MINIMUM_REQUIRED(VERSION 3.15)

set(CMAKE_CXX_STANDARD 20)

add_compile_definitions(NAPI_CPP_EXCEPTIONS)

include(${CMAKE_SOURCE_DIR}/conanbuildinfo.cmake)
conan_basic_setup()

# Get the ExternalProject module
include(ExternalProject)

# Get and build zip
ExternalProject_Add(zip_proj
        URL https://github.com/kuba--/zip/archive/v0.2.0.tar.gz
        PREFIX ${CMAKE_CURRENT_BINARY_DIR}/zip
        CMAKE_ARGS -DCMAKE_DISABLE_TESTING=ON -DCMAKE_INSTALL_PREFIX:PATH=<INSTALL_DIR>
        )

ExternalProject_Get_Property(zip_proj install_dir)
set(zip_dir ${install_dir})

# Include everything
include_directories(${zip_dir}/include ${CMAKE_SOURCE_DIR}/include ${CMAKE_JS_INC}
                    ${CMAKE_SOURCE_DIR}/external/CppJsLib ${CMAKE_SOURCE_DIR}/external/csv/single_include)

set(src ${CMAKE_SOURCE_DIR}/src)
set(AUTOBETLIB_SRC ${src}/debug/debug.cpp ${src}/autostop.cpp ${src}/logger.cpp ${src}/betting.cpp
        ${src}/opencv_link.cpp ${src}/settings.cpp ${src}/utils.cpp ${src}/webui.cpp ${src}/napi_exported.cpp
        ${src}/variables.cpp ${src}/control.cpp ${src}/windowUtils.cpp ${src}/controls/controller.cpp
        ${src}/controls/navigationStrategies.cpp ${src}/historic_data.cpp)

# Add the library
add_library(${PROJECT_NAME} SHARED ${AUTOBETLIB_SRC} ${CMAKE_JS_SRC})

# Set the library directory
target_link_directories(${PROJECT_NAME} PRIVATE ${CMAKE_SOURCE_DIR}/lib)

# n-api stuff
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

target_link_directories(${PROJECT_NAME} PRIVATE ${zip_dir}/lib)
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${CONAN_LIBS} zip vXboxInterface)

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

#set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /W4")

# NOTE: This option is required when building a debug build (debug/relWithDebInfo)
#set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /bigobj")

add_compile_definitions(CPPJSLIB_ENABLE_WEBSOCKET)
