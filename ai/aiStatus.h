#ifndef TF_AI_STATUS
#define TF_AI_STATUS
namespace tf {
class AiStatus {
 public:
  AiStatus();

  bool ok() const;

  const char* getLastStatus() const;

  void resetLastStatus();

  ~AiStatus();

  void setError(const char* status);

 private:
  bool _ok;
  char* lastStatus;
};
}  // namespace tf

#endif