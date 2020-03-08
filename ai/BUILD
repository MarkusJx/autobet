# Description:
#   TensorFlow C++ inference example for labeling images.

load("//tensorflow:tensorflow.bzl", "tf_cc_binary", "tf_cc_shared_object")

tf_cc_binary(
    name = "ai",
    srcs = [
        "tf_ai.cc",
        "tf_ai.h",
        "tf_utils.cc",
        "tf_utils.h",
        "ai.h",
        "aiStatus.h"
    ],
    linkopts = select({
        "//conditions:default": [
            "-lm",
            "-DEFAULTLIB:ws2_32.lib", # IMPORTANT: Link this library on Windows
        ],
    }),
    deps = select({
        "//conditions:default": [
            "//tensorflow/cc:cc_ops",
            "//tensorflow/core:core_cpu",
            "//tensorflow/core:framework",
            "//tensorflow/core:framework_internal",
            "//tensorflow/core:lib",
            "//tensorflow/core:protos_all_cc",
            "//tensorflow/core:tensorflow",
        ],
    }),
    copts = select({
        "@bazel_tools//src/conditions:windows": [
            "/DBUILD_TF_AI",
        ],
    }),
)

tf_cc_shared_object(
    name = "ai.dll",
    srcs = [
        "tf_ai.cc",
        "tf_ai.h",
        "tf_utils.cc",
        "tf_utils.h",
        "ai.h",
        "aiStatus.h"
    ],
    linkopts = select({
        "//conditions:default": [
            "-lm",
            "-DEFAULTLIB:ws2_32.lib", # IMPORTANT: Link this library on Windows
            "/DEBUG:FULL",
            "/OPT:REF",
            "/OPT:ICF",
            "/STACK:10000000"
        ],
    }),
    deps = select({
        "//conditions:default": [
            "//tensorflow/cc:cc_ops",
            "//tensorflow/core:core_cpu",
            "//tensorflow/core:framework",
            "//tensorflow/core:framework_internal",
            "//tensorflow/core:lib",
            "//tensorflow/core:protos_all_cc",
            "//tensorflow/core:tensorflow",
        ],
    }),
    copts = select({
        "@bazel_tools//src/conditions:windows": [
            "/DBUILD_TF_AI",
            "/DEBUG:Yes",
            "/D",
            "/W3",
            "/Zi",
            "/FS",
            "/INCREMENTAL:NO"
        ],
    }),
)

tf_cc_shared_object(
    name = "ai-release.dll",
    srcs = [
        "tf_ai.cc",
        "tf_ai.h",
        "tf_utils.cc",
        "tf_utils.h",
        "ai.h",
        "aiStatus.h"
    ],
    linkopts = select({
        "//conditions:default": [
            "-lm",
            "-DEFAULTLIB:ws2_32.lib", # IMPORTANT: Link this library on Windows
        ],
    }),
    deps = select({
        "//conditions:default": [
            "//tensorflow/cc:cc_ops",
            "//tensorflow/core:core_cpu",
            "//tensorflow/core:framework",
            "//tensorflow/core:framework_internal",
            "//tensorflow/core:lib",
            "//tensorflow/core:protos_all_cc",
            "//tensorflow/core:tensorflow",
        ],
    }),
    copts = select({
        "@bazel_tools//src/conditions:windows": [
            "/DBUILD_TF_AI",
        ],
    }),
)
