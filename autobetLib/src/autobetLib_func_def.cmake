function(gitCloneRepo REPOSITORY_URL OUT_DIRECTORY)
    # Check if git exists, if so, clone repo
    find_program(GIT_PATH git)
    if (EXISTS ${GIT_PATH})
        message(STATUS "Git is installed, cloning repository")
        # Invoke git clone
        execute_process(COMMAND "${GIT_PATH}" "clone" ${REPOSITORY_URL}
                        WORKING_DIRECTORY ${OUT_DIRECTORY}
                        RESULT_VARIABLE GIT_RES)
        # Check if command was successful
        if (${GIT_RES} STREQUAL "0")
            message(STATUS "Repository successfully cloned")
        else ()
            # Retry
            message(STATUS "Git clone failed, retrying")
            execute_process(COMMAND "${GIT_PATH}" "clone" ${REPOSITORY_URL}
                            WORKING_DIRECTORY ${OUT_DIRECTORY}
                            RESULT_VARIABLE GIT_RES)
            # Check if command was successful
            if (${GIT_RES} STREQUAL "0")
                message(STATUS "Repository successfully cloned")
            else ()
                message(FATAL_ERROR "Could not clone repository")
            endif ()
        endif ()
    else ()
        # Git is not installed, cannot download CppJsLib
        message(FATAL_ERROR "Git is not installed, cannot clone repository")
    endif ()
endfunction(gitCloneRepo)

function(downloadCppJsLib)
    set(CPPJSLIB_DIRECTORY ${CMAKE_SOURCE_DIR}/src/CppJsLib)
    if (EXISTS ${CPPJSLIB_DIRECTORY})
        message(STATUS "CppJsLib directory already exists, deleting it")
        file(REMOVE_RECURSE ${CPPJSLIB_DIRECTORY})
    endif ()

    message(STATUS "Cloning CppJsLib...")
    gitCloneRepo("https://github.com/MarkusJx/CppJsLib" "${CMAKE_SOURCE_DIR}/src")
    if (NOT EXISTS ${CPPJSLIB_DIRECTORY})
        message(FATAL_ERROR "${CPPJSLIB_DIRECTORY} does not exist, cannot continue")
    endif ()
endfunction(downloadCppJsLib)

function(downloadZip)
    set(ZIP_DIRECTORY ${CMAKE_SOURCE_DIR}/src/zip)
    if (EXISTS ${ZIP_DIRECTORY})
        message(STATUS "Zip directory already exists, deleting it")
        file(REMOVE_RECURSE ${ZIP_DIRECTORY})
    endif ()

    message(STATUS "Cloning zip...")
    gitCloneRepo("https://github.com/kuba--/zip" "${CMAKE_SOURCE_DIR}/src")
    if (NOT EXISTS ${ZIP_DIRECTORY})
        message(FATAL_ERROR "${ZIP_DIRECTORY} does not exist, cannot continue")
    endif ()
endfunction(downloadZip)

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

function(downloadAiDll)
    set(AI_DLL_FILE ${CMAKE_SOURCE_DIR}/external/ai-release.dll)
    message(STATUS "Downloading ai-release.dll")
    file(DOWNLOAD "https://www.dropbox.com/s/qrzvxjijtt8r6lz/ai-release.dll?dl=1"
        ${AI_DLL_FILE}
        SHOW_PROGRESS)
    
    if (NOT EXISTS ${AI_DLL_FILE})
        message(FATAL_ERROR "${AI_DLL_FILE} does not exist, cannot continue")
    else ()
        message(STATUS "${AI_DLL_FILE} successfully downloaded")
    endif ()
endfunction(downloadAiDll)

function(downloadAiLib)
    set(AI_LIB_FILE ${CMAKE_SOURCE_DIR}/lib/ai-release.dll.if.lib)
    message(STATUS "Downloading ai-release.dll.if.lib")
    file(DOWNLOAD "https://www.dropbox.com/s/f6dmgrhqzj7mfw5/ai-release.dll.if.lib?dl=1"
        ${AI_LIB_FILE}
        SHOW_PROGRESS)
    
    if (NOT EXISTS ${AI_LIB_FILE})
        message(FATAL_ERROR "${AI_LIB_FILE} does not exist, cannot continue")
    else ()
        message(STATUS "${AI_LIB_FILE} successfully downloaded")
    endif ()
endfunction(downloadAiLib)

function(copyAiDll SOURCE_PATH)
    set(AI_DLL_FILE ${CMAKE_SOURCE_DIR}/external/ai-release.dll)
    message(STATUS "Copying ai-release.dll")
    file(COPY ${SOURCE_PATH}
            DESTINATION ${AI_DLL_FILE})
    
    if (NOT EXISTS ${AI_DLL_FILE})
        message(FATAL_ERROR "${AI_DLL_FILE} does not exist, cannot continue")
    else ()
        message(STATUS "${AI_DLL_FILE} successfully copied")
    endif ()
endfunction(copyAiDll)

function(copyAiLib SOURCE_PATH)
    set(AI_LIB_FILE ${CMAKE_SOURCE_DIR}/lib/ai-release.dll.if.lib)
    message(STATUS "Copying ai-release.dll.if.lib")
    file(COPY ${SOURCE_PATH}
            DESTINATION ${AI_LIB_FILE})

    if (NOT EXISTS ${AI_LIB_FILE})
        message(FATAL_ERROR "${AI_LIB_FILE} does not exist, cannot continue")
    else ()
        message(STATUS "${AI_LIB_FILE} successfully copied")
    endif ()
endfunction(copyAiLib)

