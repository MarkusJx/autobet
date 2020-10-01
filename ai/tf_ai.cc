/* This File contains code from the tensorflow repository
It can be found here:
https://github.com/tensorflow/tensorflow/tree/master/tensorflow/examples/label_image

Copyright notice:
Copyright 2015 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

#include "tf_ai.hpp"
#include "tf_utils.hpp"

#define input_width 224
#define input_height 224
#define input_mean 0
#define input_std 255
#define input_layer "input_1"
#define output_layer "predictions/Softmax"

#ifndef BUILD_TF_AI
#   define TF_AI_EXPORT
#endif

using namespace tf;
using namespace tensorflow;

// AI class definition ====================================

TF_AI_EXPORT tf::AI *tf::AI::create(const char *modelPath, tf::labels l) {
    return new tf::AI(modelPath, l);
}

TF_AI_EXPORT void tf::AI::destroy(tf::AI *toDestroy) {
    delete toDestroy;
}

TF_AI_EXPORT short tf::AI::predict(char *image, size_t size) {
    if (image == nullptr) {
        status->setError("image pointer was nullptr");
        return -1;
    }

    if (size == 0) {
        status->setError("image size was zero");
        return -1;
    }

    int index = static_cast<tf_ai *>(ai)->process(image, size);
    if (index >= 0 || index < labels_size) {
        return this->labels[index];
    } else {
        return -1;
    }
}

TF_AI_EXPORT tf::AiStatus *tf::AI::getStatus() const noexcept {
    return this->status;
}

TF_AI_EXPORT tf::AI::AI(const char *modelPath, tf::labels l) {
    this->labels = l.labels;
    this->labels_size = l.labels_size;

    status = new tf::AiStatus();
    ai = static_cast<void *>(new tf_ai(modelPath, status));
}

TF_AI_EXPORT tf::AI::~AI() {
    delete status;
    delete static_cast<tf_ai *>(ai);
}

// Ai Status ==============================================
AiStatus::AiStatus() {
    lastStatus = nullptr;
    _ok = true;
}

TF_AI_EXPORT bool AiStatus::ok() const noexcept {
    return this->_ok;
}

TF_AI_EXPORT const char *AiStatus::getLastStatus() const noexcept {
    if (this->lastStatus == nullptr) {
        return "";
    } else {
        return this->lastStatus;
    }
}

TF_AI_EXPORT void AiStatus::resetLastStatus() {
    if (lastStatus != nullptr) {
        free(lastStatus);
    }

    _ok = true;
    lastStatus = nullptr;
}

void AiStatus::setError(const char *status) {
    resetLastStatus();
    lastStatus = _strdup(status);
    this->_ok = false;
}

AiStatus::~AiStatus() {
    if (lastStatus != nullptr) {
        free(lastStatus);
    }
}

// Tensorflow basic ai ====================================
tf_ai::tf_ai(string graph, AiStatus *status) {
    _status = status;
    Status load_graph_status = LoadGraph(graph, &session);
    if (!load_graph_status.ok()) {
        LOG(ERROR) << load_graph_status;
        _status->setError(load_graph_status.ToString().c_str());
    }
}

int tf_ai::process(char *image, size_t img_size) {
    std::vector<Tensor> resized_tensors;
    Status read_tensor_status =
            ReadTensorFromPng(image, img_size, input_height, input_width, input_mean,
                              input_std, &resized_tensors);
    if (!read_tensor_status.ok()) {
        LOG(ERROR) << read_tensor_status;
        _status->setError(read_tensor_status.ToString().c_str());
        return -1;
    }
    const Tensor &resized_tensor = resized_tensors[0];

    // Actually run the image through the model.
    std::vector<Tensor> outputs;
    Status run_status = session->Run({{input_layer, resized_tensor}},
                                     {output_layer}, {}, &outputs);
    if (!run_status.ok()) {
        LOG(ERROR) << "Running model failed: " << run_status;
        _status->setError(run_status.ToString().c_str());
        return -1;
    }

    return getTopLabel(outputs, _status);
}

int tf_ai::selfTest(const char *fileName) {
    std::vector<Tensor> resized_tensors;
    string image_path = tensorflow::io::JoinPath("", fileName);

    Status read_tensor_status =
            ReadTensorFromImageFile(image_path, input_height, input_width, input_mean,
                                    input_std, &resized_tensors);
    if (!read_tensor_status.ok()) {
        LOG(ERROR) << read_tensor_status;
        _status->setError(read_tensor_status.ToString().c_str());
        return -1;
    }
    const Tensor &resized_tensor = resized_tensors[0];

    // Actually run the image through the model.
    std::vector<Tensor> outputs;
    Status run_status = session->Run({{input_layer, resized_tensor}},
                                     {output_layer}, {}, &outputs);
    if (!run_status.ok()) {
        LOG(ERROR) << "Running model failed: " << run_status;
        _status->setError(run_status.ToString().c_str());
        return -1;
    }

    return getTopLabel(outputs, _status);
}

tf_ai::~tf_ai() { session->Close(); }

// Main ======================================================
int main(int argc, char *argv[]) {
    AiStatus *status = new AiStatus();
    tf::tf_ai *ai = new tf::tf_ai("data/betting.pb", status);

    std::cout << "Performing self-Test..." << std::endl << std::endl;

    std::cout << "0: " << ai->selfTest("data/0.jpg") << std::endl;
    std::cout << "1: " << ai->selfTest("data/1.jpg") << std::endl;
    std::cout << "2: " << ai->selfTest("data/2.jpg") << std::endl;
    std::cout << "3: " << ai->selfTest("data/3.jpg") << std::endl;
    std::cout << "4: " << ai->selfTest("data/4.jpg") << std::endl;
    std::cout << "5: " << ai->selfTest("data/5.jpg") << std::endl;
    std::cout << "6: " << ai->selfTest("data/6.jpg") << std::endl;
    std::cout << "7: " << ai->selfTest("data/7.jpg") << std::endl;
    std::cout << "8: " << ai->selfTest("data/8.jpg") << std::endl;
    std::cout << "9: " << ai->selfTest("data/9.jpg") << std::endl;
    std::cout << "10: " << ai->selfTest("data/10.jpg") << std::endl;

    std::cout << std::endl << "AI exited with status: ";
    if (status->ok()) {
        std::cout << "ok" << std::endl;
    } else {
        std::cout << ai->_status->getLastStatus() << std::endl;
    }

    delete ai;

    std::cout << "Self-Test finished" << std::endl;
}