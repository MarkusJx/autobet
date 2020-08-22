IF "%1"=="--release" (
    bazel build --jobs 6 --config=opt //tensorflow/ai:ai
) ELSE (
    bazel build --jobs 6 --compilation_mode dbg -c dbg -c opt --config=opt //tensorflow/ai:ai
)