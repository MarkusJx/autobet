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
