#ifndef AUTOBET_JSCALLBACK_HPP
#define AUTOBET_JSCALLBACK_HPP

#include "napi_tools.hpp"

template<typename T>
struct napi_type;

template<>
struct napi_type<bool> {
    static Napi::Value create(Napi::Env env, bool val) {
        return Napi::Boolean::New(env, val);
    }
};

template<>
struct napi_type<int> {
    static Napi::Value create(Napi::Env env, int val) {
        return Napi::Number::New(env, val);
    }
};

template<>
struct napi_type<std::string> {
    static Napi::Value create(Napi::Env env, const std::string &val) {
        return Napi::String::New(env, val);
    }
};

template<typename T>
class javascriptCallback {
public:
    explicit inline javascriptCallback(const Napi::CallbackInfo &info) : deferred(
            Napi::Promise::Deferred::New(info.Env())), queue(), mtx() {
        CHECK_ARGS(napi_tools::type::FUNCTION);
        Napi::Env env = info.Env();

        run = true;

        // Create a new ThreadSafeFunction.
        this->ts_fn = Napi::ThreadSafeFunction::New(env, info[0].As<Napi::Function>(), "javascriptCallback", 0, 1, this,
                                                    FinalizerCallback < T > , (void *) nullptr);
        this->nativeThread = std::thread(threadEntry < T > , this);
    }

    inline void asyncCall(T value) {
        mtx.lock();
        queue.push_back(value);
        mtx.unlock();
    }

    [[nodiscard]] inline Napi::Promise getPromise() const {
        return deferred.Promise();
    }

    inline void stop() {
        run = false;
    }

private:
    template<typename U>
    static void threadEntry(javascriptCallback<U> *jsCallback) {
        auto callback = [](Napi::Env env, Napi::Function jsCallback, U *data) {
            jsCallback.Call({napi_type<U>::create(env, *data)});
            delete data;
        };

        while (jsCallback->run) {
            jsCallback->mtx.lock();
            for (const U &val : jsCallback->queue) {
                U *tmp = new U(val);
                napi_status status = jsCallback->ts_fn.BlockingCall(tmp, callback);

                if (status != napi_ok) {
                    Napi::Error::Fatal("ThreadEntry", "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
                }
            }
            jsCallback->queue.clear();
            jsCallback->mtx.unlock();
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }

        jsCallback->ts_fn.Release();
    }

    template<typename U>
    static void FinalizerCallback(Napi::Env env, void *, javascriptCallback<U> *jsCallback) {
        jsCallback->nativeThread.join();

        jsCallback->deferred.Resolve(env.Null());
        delete jsCallback;
    }

    ~javascriptCallback() = default;

    bool run;
    std::mutex mtx;
    std::vector<T> queue;
    const Napi::Promise::Deferred deferred;
    std::thread nativeThread;
    Napi::ThreadSafeFunction ts_fn;
};

class javascriptVoidCallback {
public:
    explicit inline javascriptVoidCallback(const Napi::CallbackInfo &info) : deferred(
            Napi::Promise::Deferred::New(info.Env())), numCalls(0), run(true) {
        CHECK_ARGS(napi_tools::type::FUNCTION);
        Napi::Env env = info.Env();

        // Create a new ThreadSafeFunction.
        this->ts_fn = Napi::ThreadSafeFunction::New(env, info[0].As<Napi::Function>(), "javascriptCallback", 0, 1, this,
                                                    FinalizerCallback, (void *) nullptr);
        this->nativeThread = std::thread(threadEntry, this);
    }

    inline void asyncCall() {
        mtx.lock();
        numCalls++;
        mtx.unlock();
    }

    [[nodiscard]] inline Napi::Promise getPromise() const {
        return deferred.Promise();
    }

    inline void stop() {
        run = false;
    }

private:
    static void threadEntry(javascriptVoidCallback *jsCallback) {
        auto callback = [jsCallback](Napi::Env env, Napi::Function jsFunc, void *data) {
            jsFunc.Call({});
        };

        while (jsCallback->run) {
            jsCallback->mtx.lock();
            for (int i = 0; i < jsCallback->numCalls; i++) {
                napi_status status = jsCallback->ts_fn.BlockingCall((void *) nullptr, callback);

                if (status != napi_ok) {
                    Napi::Error::Fatal("ThreadEntry", "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
                }
            }
            jsCallback->numCalls = 0;
            jsCallback->mtx.unlock();
            std::this_thread::sleep_for(std::chrono::milliseconds(10));
        }

        jsCallback->ts_fn.Release();
    }

    static void FinalizerCallback(Napi::Env env, void *, javascriptVoidCallback *jsCallback) {
        jsCallback->nativeThread.join();

        jsCallback->deferred.Resolve(env.Null());
        delete jsCallback;
    }

    ~javascriptVoidCallback() = default;

    bool run;
    int numCalls;
    std::mutex mtx;
    const Napi::Promise::Deferred deferred;
    std::thread nativeThread;
    Napi::ThreadSafeFunction ts_fn;
};

#endif //AUTOBET_JSCALLBACK_HPP
