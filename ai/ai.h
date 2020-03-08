#ifndef AI_DLL_H
#define AI_DLL_H

#ifndef TF_AI_EXPORT
#ifndef __LINUX__
#ifdef BUILD_TF_AI
#define TF_AI_EXPORT __declspec(dllexport)
#else
#define TF_AI_EXPORT __declspec(dllimport)
#endif
#else
#define TF_AI_EXPORT
#endif
#endif

namespace tf {
  namespace BettingAI {
    TF_AI_EXPORT bool initAi();

    TF_AI_EXPORT bool initialized();

    TF_AI_EXPORT short predict(char *image, size_t size);

    TF_AI_EXPORT short selfTest(const char* fileName);

    TF_AI_EXPORT void deleteAi();
    namespace status {
      TF_AI_EXPORT bool ok();

      TF_AI_EXPORT char* getLastStatus();
    }
  }

  namespace WinningsAI {
    TF_AI_EXPORT bool initAi();

    TF_AI_EXPORT bool initialized();

    TF_AI_EXPORT short predict(char *image, size_t size);

    TF_AI_EXPORT short selfTest(const char* fileName);

    TF_AI_EXPORT void deleteAi();
    namespace status {
      TF_AI_EXPORT bool ok();

      TF_AI_EXPORT char* getLastStatus();
    }
  }
}  // namespace tf

#endif