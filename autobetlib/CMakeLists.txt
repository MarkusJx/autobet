cmake_policy(SET CMP0074 NEW)
cmake_policy(SET CMP0048 NEW)

project(autobetLib CXX)
CMAKE_MINIMUM_REQUIRED(VERSION 3.15)

set(CONAN_DISABLE_CHECK_COMPILER TRUE)
set(CMAKE_CXX_STANDARD 20)

add_compile_definitions(NAPI_CPP_EXCEPTIONS)

include(${CMAKE_SOURCE_DIR}/conanbuildinfo.cmake)
conan_basic_setup()

include(${CMAKE_SOURCE_DIR}/util.cmake)

# Get the ExternalProject module
include(ExternalProject)
include(FetchContent)

# Get and build zip
ExternalProject_Add(
        zip_proj
        URL https://github.com/kuba--/zip/archive/v0.2.0.tar.gz
        PREFIX ${CMAKE_CURRENT_BINARY_DIR}/zip
        CMAKE_ARGS -DCMAKE_DISABLE_TESTING=ON -DCMAKE_INSTALL_PREFIX:PATH=<INSTALL_DIR>
)

ExternalProject_Get_Property(zip_proj install_dir)
set(zip_dir ${install_dir})

ExternalProject_Add(
        pusha_proj
        GIT_REPOSITORY https://github.com/MarkusJx/pusha
        GIT_TAG 354465ab54c78022a7f2ca375f348e0bb06a33c6
        INSTALL_COMMAND ${CMAKE_COMMAND} -E echo "Skipping install step"
        CMAKE_ARGS -DOPENSSL_ROOT_DIR=${CONAN_OPENSSL_ROOT}
)

ExternalProject_Get_Property(pusha_proj install_dir)
set(pusha_dir ${install_dir})

FetchContent_Declare(
        CPPUPnP
        GIT_REPOSITORY https://github.com/equalitie/cpp-upnp
        GIT_TAG a949b9f272c38badd39f764d5587a0c7e8f33e14
)

FetchContent_MakeAvailable(CPPUPnP)

set(CPPUPnP_DIR ${CMAKE_BINARY_DIR}/_deps/cppupnp-src)
add_library(
        cpp_upnp STATIC
        ${CPPUPnP_DIR}/src/xml.cpp
        ${CPPUPnP_DIR}/src/igd.cpp
        ${CPPUPnP_DIR}/src/ssdp.cpp
        ${CPPUPnP_DIR}/src/url.cpp
        ${CPPUPnP_DIR}/src/parse_device.cpp
)

target_include_directories(cpp_upnp PUBLIC ${CPPUPnP_DIR}/include)
target_link_libraries(cpp_upnp PRIVATE ${CONAN_LIBS})

set(PROJECT_NAME autobetLib)

execute_process(COMMAND node -p "require('@markusjx/n-api-tools').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE N_API_TOOLS_DIR)

# Include everything
include_directories(
        ${zip_dir}/include ${CMAKE_SOURCE_DIR}/include ${CMAKE_JS_INC} ${N_API_TOOLS_DIR} cpp_upnp
        ${CMAKE_SOURCE_DIR}/external/CppJsLib ${CMAKE_SOURCE_DIR}/external/csv/single_include
        ${pusha_dir}/src/pusha_proj/include_cpp
        ${pusha_dir}/src/pusha_proj/include
        ${pusha_dir}/src/pusha_proj/third/ecec/include
)

set(src ${CMAKE_SOURCE_DIR}/src)
set(
        AUTOBETLIB_SRC ${src}/debug/debug.cpp ${src}/autostop.cpp ${src}/logger.cpp ${src}/betting.cpp
        ${src}/opencv_link.cpp ${src}/storage/settings.cpp ${src}/util/utils.cpp ${src}/web/webui.cpp
        ${src}/napi_exported.cpp ${src}/variables.cpp ${src}/control.cpp ${src}/windowUtils.cpp
        ${src}/controls/controller.cpp ${src}/controls/navigationStrategies.cpp ${src}/web/push_notifications.cpp
        ${src}/historic_data.cpp ${src}/storage/database.cpp ${src}/objects/push_notification_subscriber.cpp
        ${src}/exposed_methods.cpp ${src}/util/iputil.cpp ${src}/web/upnp.cpp
        ${src}/util/recurring_job.cpp ${src}/web/certificate.cpp)

# Add the library
add_library(${PROJECT_NAME} SHARED ${AUTOBETLIB_SRC} ${CMAKE_JS_SRC})

# Set the library directory
target_link_directories(${PROJECT_NAME} PRIVATE ${CMAKE_SOURCE_DIR}/lib)

# Set pusha imports
set(PUSHA_LIB "${pusha_dir}/src/pusha_proj-build/${CMAKE_BUILD_TYPE}/pusha.lib")
set(ECE_LIB "${pusha_dir}/src/pusha_proj-build/third/ecec/${CMAKE_BUILD_TYPE}/ece.lib")

# n-api stuff
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

target_link_directories(${PROJECT_NAME} PRIVATE ${zip_dir}/lib)
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} zip vXboxInterface ${PUSHA_LIB}
        ${ECE_LIB} ${CONAN_LIBS} cpp_upnp)

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
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} /bigobj")

add_compile_definitions(CPPHTTPLIB_BROTLI_SUPPORT)
add_compile_definitions(CPPJSLIB_ENABLE_WEBSOCKET)
add_compile_definitions(CPPJSLIB_ENABLE_HTTPS)

if (ADD_DEPENDENCIES)
    message(STATUS "Adding dependencies")
    add_dependencies(${PROJECT_NAME} zip_proj pusha_proj)
endif ()
