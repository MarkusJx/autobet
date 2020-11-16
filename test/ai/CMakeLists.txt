project(ai_test)
cmake_minimum_required(VERSION 3.15)

set(CMAKE_CXX_STANDARD 17)

include(functions.cmake)

include_directories(../../ai)
link_directories(lib)

add_executable(ai_test ai_test.cpp)

target_link_libraries(${PROJECT_NAME} PRIVATE ai-release.dll.if.lib)

createDirectory(${CMAKE_SOURCE_DIR}/lib)
createDirectory(${CMAKE_SOURCE_DIR}/external)
createDirectory(${CMAKE_SOURCE_DIR}/data)

if (DEFINED ENV{AI_LIB_LOCATION} AND DEFINED ENV{AI_DLL_LOCATION})
    message(STATUS "Both 'AI_LIB_LOCATION' and 'AI_DLL_LOCATION' are set, copying the files")
    message(STATUS "'AI_LIB_LOCATION' set to: $ENV{AI_LIB_LOCATION}")
    message(STATUS "'AI_DLL_LOCATION' set to: $ENV{AI_DLL_LOCATION}")

    # Copy ai dll files
    copyAiDll($ENV{AI_DLL_LOCATION})
    copyAiLib($ENV{AI_LIB_LOCATION})
else ()
    message(WARNING "'AI_LIB_LOCATION' or 'AI_DLL_LOCATION' or both are not set, downloading the files")

    downloadAiDll()
    downloadAiLib()
endif ()

downloadModel()

copyImages()

include(ExternalProject)

# Get and build gtest
ExternalProject_Add(gtest
                    URL https://github.com/google/googletest/archive/release-1.10.0.tar.gz
                    PREFIX ${CMAKE_CURRENT_BINARY_DIR}/gtest
                    CMAKE_ARGS -Dgtest_force_shared_crt=ON -DBUILD_GMOCK=OFF -DCMAKE_INSTALL_PREFIX:PATH=<INSTALL_DIR>
                    )

ExternalProject_Get_Property(gtest install_dir)
set(gtest_dir ${install_dir})

# Include gtest
include_directories(${gtest_dir}/include)

# Set link directories to gtest_dir/lib
target_link_directories(${PROJECT_NAME} PRIVATE ${gtest_dir}/lib)
target_link_libraries(${PROJECT_NAME} PRIVATE gtest_maind gtestd)

# Add dependencies
add_dependencies(${PROJECT_NAME} gtest)

# Copy files post-build
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy external/ai-release.dll ${PROJECT_BINARY_DIR}/ai-release.dll
    COMMENT "Copied ${PROJECT_BINARY_DIR}/ai-release.dll"
)

add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory img ${PROJECT_BINARY_DIR}/img
    COMMENT "Copied ${PROJECT_BINARY_DIR}/img")

add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory data ${PROJECT_BINARY_DIR}/data
    COMMENT "Copied ${PROJECT_BINARY_DIR}/data")