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

function(copyImages)
    set(IMG_DIR ${CMAKE_SOURCE_DIR}/img)
    if (EXISTS ${IMG_DIR})
        message(STATUS "${IMG_DIR} already exists, deleting it")
        file(REMOVE_RECURSE ${IMG_DIR})

        if (NOT EXISTS ${IMG_DIR})
            message(STATUS "${IMG_DIR} successfully deleted")
        else ()
            message(FATAL_ERROR "Could not delete ${IMG_DIR}")
        endif ()
    endif ()

    message(STATUS "Copying image data")

    file(COPY ../../ai_train/train_ai/test
            DESTINATION ${CMAKE_SOURCE_DIR})
    file(RENAME ${CMAKE_SOURCE_DIR}/test ${IMG_DIR})

    if (NOT EXISTS ${IMG_DIR})
        message(FATAL_ERROR "${IMG_DIR} does not exist, cannot continue")
    else ()
        message(STATUS "${IMG_DIR} successfully copied")
    endif ()
endfunction(copyImages)
