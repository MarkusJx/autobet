#ifndef TF_AI_H
#define TF_AI_H

#include "ai.h"
#include "tf_utils.h"

namespace tf {
class tf_ai {
 public:
  tf_ai(string graph, AiStatus* status);

  int process(char*, size_t);

  int selfTest(const char*);

  ~tf_ai();

  AiStatus* _status;

 private:
  std::unique_ptr<tensorflow::Session> session;
};

const short betting_labels[10] = {1, 10, 2, 3, 4, 5, 6, 7, 8, 9};

const short winnings_labels[5] = {20, 30, 40, 50, 0};
}  // namespace tf

#endif
