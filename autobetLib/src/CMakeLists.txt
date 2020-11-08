project(autobetLib CXX)
CMAKE_MINIMUM_REQUIRED(VERSION 3.15)

set(CMAKE_CXX_STANDARD 20)

include_directories(${CMAKE_JS_INC})
add_compile_definitions(NAPI_CPP_EXCEPTIONS)

option(BUILD_CPPJSLIB FALSE)

add_compile_definitions(AUTOBET_ENABLE_FULL_DEBUG)
message(STATUS "Building with debug:full support")

include(autobetLib_func_def.cmake)

# Download the zip repo
downloadZip()
set(ZIP_SOURCE_DIRECTORY ${CMAKE_SOURCE_DIR}/src/zip/src)

file(GLOB zip
        "${ZIP_SOURCE_DIRECTORY}/*.h"
        "${ZIP_SOURCE_DIRECTORY}/*.c"
        )

set(AI_SRC_DIRECTORY ${CMAKE_SOURCE_DIR}/../ai)
if (NOT EXISTS ${AI_SRC_DIRECTORY})
    message(ERROR "${AI_SRC_DIRECTORY} does not exists, cannot continue")
endif ()

include_directories(${CMAKE_SOURCE_DIR}/include ${AI_SRC_DIRECTORY})
link_directories(${CMAKE_SOURCE_DIR}/lib ${Boost_LIBRARY_DIRS} "C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\VC\\Tools\\MSVC\\14.27.29110\\atlmfc\\lib\\x64")

file(GLOB src
        "*.hpp"
        "*.cpp"
        )

add_library(${PROJECT_NAME} SHARED ${src} ${include} ${zip} ${CMAKE_JS_SRC})

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

# If BUILD_CPPJSLIB is set, download the CppJsLib repo and add the files to the library
if (BUILD_CPPJSLIB)
    downloadCppJsLib()

    include(CppJsLib/src/InitCppJsLib.cmake)
    initCppJsLib(${PROJECT_NAME} "CppJsLib/src" "${CMAKE_SOURCE_DIR}/include" TRUE FALSE)

    if (EXISTS ${CMAKE_SOURCE_DIR}/websocketpp)
        message(STATUS "Deleting websocketpp folder")
        file(REMOVE_RECURSE ${CMAKE_SOURCE_DIR}/websocketpp)
    endif ()

    add_compile_definitions(BUILD_CPPJSLIB)
else ()
    target_link_libraries(${PROJECT_NAME} CppJsLib)
endif ()

# Create 'external' and 'lib' directory
createDirectory(${CMAKE_SOURCE_DIR}/external)
createDirectory(${CMAKE_SOURCE_DIR}/lib)

# Download ai dll files
downloadAiDll()
downloadAiLib()