#ifndef TF_AI_STATUS
#define TF_AI_STATUS
namespace tf {
class AiStatus {
 public:
  AiStatus();

  bool ok();

  char* getLastStatus();

  void resetLastStatus();

  ~AiStatus();

  void setError(const char* status);

 private:
  bool _ok;
  char* lastStatus;
};
}  // namespace tf

#endif