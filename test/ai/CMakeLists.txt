project(ai_test)
cmake_minimum_required(VERSION 3.15)

function(createDirectory TO_CREATE)
    if (EXISTS ${TO_CREATE})
        message(STATUS "Directory to create exists, deleting it")
        file(REMOVE_RECURSE ${TO_CREATE})
    else()
        message(STATUS "Directory to create does not exist, not deleting anything")
    endif ()

    message(STATUS "Creating directory: ${TO_CREATE}")
    file(MAKE_DIRECTORY ${TO_CREATE})
endfunction(createDirectory)

function(copyAiDll SOURCE_PATH)
    set(AI_DLL_DIR ${CMAKE_SOURCE_DIR}/external)
    set(AI_DLL_FILE ${AI_DLL_DIR}/ai-release.dll)
    message(STATUS "Copying ai-release.dll")
    file(COPY ${SOURCE_PATH}
            DESTINATION ${AI_DLL_DIR})
    
    if (NOT EXISTS ${AI_DLL_FILE})
        message(FATAL_ERROR "${AI_DLL_FILE} does not exist, cannot continue")
    else ()
        message(STATUS "${AI_DLL_FILE} successfully copied")
    endif ()
endfunction(copyAiDll)

function(copyAiLib SOURCE_PATH)
    set(AI_LIB_DIR ${CMAKE_SOURCE_DIR}/lib)
    set(AI_LIB_FILE ${AI_LIB_DIR}/ai-release.dll.if.lib)
    message(STATUS "Copying ai-release.dll.if.lib")
    file(COPY ${SOURCE_PATH}
            DESTINATION ${AI_LIB_DIR})

    if (NOT EXISTS ${AI_LIB_FILE})
        message(FATAL_ERROR "${AI_LIB_FILE} does not exist, cannot continue")
    else ()
        message(STATUS "${AI_LIB_FILE} successfully copied")
    endif ()
endfunction(copyAiLib)

function(downloadModel)
    set(MODEL_FILE ${CMAKE_SOURCE_DIR}/data/model.pb)
    message(STATUS "Downloading model.pb")
    file(DOWNLOAD "https://www.dropbox.com/s/v0vmc92ywqsbw3k/optimized_model.pb?dl=1"
            ${MODEL_FILE}
            SHOW_PROGRESS)
    
    if (NOT EXISTS ${MODEL_FILE})
        message(FATAL_ERROR "${MODEL_FILE} does not exist, cannot continue")
    else ()
        message(STATUS "${MODEL_FILE} successfully downloaded")
    endif ()
endfunction(downloadModel)

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
    message(FATAL_ERROR "'AI_LIB_LOCATION' or 'AI_DLL_LOCATION' or both are not set, cannot continue")
endif ()

downloadModel()

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