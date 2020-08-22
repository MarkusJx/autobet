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

    inline ~javascriptVoidCallback() = default;

    bool run;
    int numCalls;
    std::mutex mtx;
    const Napi::Promise::Deferred deferred;
    std::thread nativeThread;
    Napi::ThreadSafeFunction ts_fn;
};

/**
 * A class for creating js promises. This class must exist since the original n-api is so bad and cannot provide
 * such a simple behaviour by default. Also, the docs on Promises are worth shit, just as a side note.
 * You will need to look at the examples to find this, why not?
 *
 * Source: https://github.com/nodejs/node-addon-examples/issues/85#issuecomment-583887294
 * Also exists here: https://github.com/nodejs/node-addon-examples/blob/master/async_pi_estimate/node-addon-api/async.cc
 */
class VoidPromise : public Napi::AsyncWorker {
public:
    /**
     * Create a javascript promise
     *
     * @param env the environment of the promise
     * @param fn the function to call. Must return T.
     * @return a Napi::Promise
     */
    static Napi::Promise create(const Napi::Env &env, std::function<void()> fn) {
        auto *promise = new VoidPromise(env, std::move(fn));
        promise->Queue();

        return promise->GetPromise();
    }

protected:
    /**
     * Construct a Promise
     *
     * @param env the environment to work in
     * @param _fn the function to call
     */
    inline VoidPromise(const Napi::Env &env, std::function<void()> _fn) : Napi::AsyncWorker(env),
                                                                   deferred(Napi::Promise::Deferred::New(env)),
                                                                   fn(std::move(_fn)) {}

    /**
     * A default destructor
     */
    inline ~VoidPromise() override = default;

    /**
     * The execution thread
     */
    inline void Execute() override {
        try {
            fn();
        } catch (std::exception &e) {
            Napi::AsyncWorker::SetError(e.what());
        } catch (...) {
            Napi::AsyncWorker::SetError("An unknown error occurred");
        }
    }

    /**
     * On ok
     */
    inline void OnOK() override {
        deferred.Resolve(Env().Undefined());
    }

    /**
     * On error
     *
     * @param error the error to throw
     */
    inline void OnError(const Napi::Error &error) override {
        deferred.Reject(error.Value());
    }

    /**
     * Get the promise
     *
     * @return a Napi::Promise
     */
    inline Napi::Promise GetPromise() {
        return deferred.Promise();
    }

private:
    std::function<void()> fn;
    Napi::Promise::Deferred deferred;
};

/**
 * A class for creating js promises. This class must exist since the original n-api is so bad and cannot provide
 * such a simple behaviour by default. Also, the docs on Promises are worth shit, just as a side note.
 * You will need to look at the examples to find this, why not?
 *
 * Source: https://github.com/nodejs/node-addon-examples/issues/85#issuecomment-583887294
 * Also exists here: https://github.com/nodejs/node-addon-examples/blob/master/async_pi_estimate/node-addon-api/async.cc
 *
 * @tparam T the return type of the operation
 */
template<typename T>
class Promise : public Napi::AsyncWorker {
public:
    /**
     * Create a javascript promise
     *
     * @param env the environment of the promise
     * @param fn the function to call. Must return T.
     * @return a Napi::Promise
     */
    static Napi::Promise create(const Napi::Env &env, std::function<T()> fn) {
        auto *promise = new Promise<T>(env, std::move(fn));
        promise->Queue();

        return promise->GetPromise();
    }

protected:
    /**
     * Construct a Promise
     *
     * @param env the environment to work in
     * @param _fn the function to call
     */
    inline Promise(const Napi::Env &env, std::function<T()> _fn) : Napi::AsyncWorker(env),
                                                                   deferred(Napi::Promise::Deferred::New(env)),
                                                                   fn(std::move(_fn)) {}

    /**
     * A default destructor
     */
    inline ~Promise() override = default;

    /**
     * The execution thread
     */
    inline void Execute() override {
        try {
            val = fn();
        } catch (std::exception &e) {
            Napi::AsyncWorker::SetError(e.what());
        } catch (...) {
            Napi::AsyncWorker::SetError("An unknown error occurred");
        }
    }

    /**
     * On ok
     */
    inline void OnOK() override {
        deferred.Resolve(napi_type<T>::create(Env(), val));
    }

    /**
     * On error
     *
     * @param error the error to throw
     */
    inline void OnError(const Napi::Error &error) override {
        deferred.Reject(error.Value());
    }

    /**
     * Get the promise
     *
     * @return a Napi::Promise
     */
    inline Napi::Promise GetPromise() {
        return deferred.Promise();
    }

private:
    std::function<T()> fn;
    T val;
    Napi::Promise::Deferred deferred;
};


#endif //AUTOBET_JSCALLBACK_HPP
