/*
 * napi_tools.hpp
 *
 * Licensed under the MIT License
 *
 * Copyright (c) 2020 MarkusJx
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
#ifndef NAPI_TOOLS_NAPI_TOOLS_HPP
#define NAPI_TOOLS_NAPI_TOOLS_HPP

#include <iostream>
#include <napi.h>
#include <thread>
#include <memory>
#include <future>
#include <map>

#ifndef NAPI_TOOLS_CALLBACK_SLEEP_TIME
    // The time to sleep between checking for new
    // function calls in the queue in callbacks
#   define NAPI_TOOLS_CALLBACK_SLEEP_TIME 10
#endif // NAPI_TOOLS_CALLBACK_SLEEP_TIME

#define TRY try {
#define CATCH_EXCEPTIONS                                                 \
    } catch (const std::exception& e) {                                  \
        throw Napi::Error::New(info.Env(), e.what());                    \
    } catch (...) {                                                      \
        throw Napi::Error::New(info.Env(), "An unknown error occurred"); \
    }

#define CHECK_ARGS(...)            \
    ::napi_tools::util::checkArgs( \
        info, ::napi_tools::util::removeNamespace(__FUNCTION__), { __VA_ARGS__ })
#define CHECK_LENGTH(len)       \
    if (info.Length() != len)   \
    throw Napi::TypeError::New( \
        info.Env(),             \
        ::napi_tools::util::removeNamespace(__FUNCTION__) + " requires " + std::to_string(len) + " arguments")

// Export a n-api function with the name of func, an environment and the exports variable
#define EXPORT_FUNCTION(exports, env, func) exports.Set(#func, ::Napi::Function::New(env, func))

/**
 * The napi_tools namespace
 */
namespace napi_tools {
    /**
     * Napi types
     */
    enum napi_type {
        STRING,
        NUMBER,
        FUNCTION,
        OBJECT,
        BOOLEAN,
        ARRAY,
        UNDEFINED
    };

    /**
     * Utility namespace
     */
    namespace util {
        /**
         * Remove all namespace names from a function name
         *
         * @param str the function name
         * @return the function name without all namespace names
         */
        inline std::string removeNamespace(const std::string &str) {
            return str.substr(str.rfind(':') + 1);
        }

        /**
         * Check the argument types of a function
         *
         * @param info the callback info
         * @param funcName the function name
         * @param types the expected argument types
         */
        inline void
        checkArgs(const Napi::CallbackInfo &info, const std::string &funcName, const std::vector<napi_type> &types) {
            Napi::Env env = info.Env();
            if (info.Length() < types.size()) {
                throw Napi::TypeError::New(env, funcName + " requires " + std::to_string(types.size()) + " arguments");
            }

            for (size_t i = 0; i < types.size(); i++) {
                if (types[i] == STRING) {
                    if (!info[i].IsString()) {
                        throw Napi::TypeError::New(env, "Argument type mismatch: " + funcName +
                                                        " requires type string at position " + std::to_string(i + 1));
                    }
                } else if (types[i] == NUMBER) {
                    if (!info[i].IsNumber()) {
                        throw Napi::TypeError::New(env, "Argument type mismatch: " + funcName +
                                                        " requires type number at position " + std::to_string(i + 1));
                    }
                } else if (types[i] == FUNCTION) {
                    if (!info[i].IsFunction()) {
                        throw Napi::TypeError::New(env, "Argument type mismatch: " + funcName +
                                                        " requires type function at position " + std::to_string(i + 1));
                    }
                } else if (types[i] == OBJECT) {
                    if (!info[i].IsObject()) {
                        throw Napi::TypeError::New(env, "Argument type mismatch: " + funcName +
                                                        " requires type object at position " + std::to_string(i + 1));
                    }
                } else if (types[i] == BOOLEAN) {
                    if (!info[i].IsBoolean()) {
                        throw Napi::TypeError::New(env, "Argument type mismatch: " + funcName +
                                                        " requires type boolean at position " + std::to_string(i + 1));
                    }
                } else if (types[i] == ARRAY) {
                    if (!info[i].IsArray()) {
                        throw Napi::TypeError::New(env, "Argument type mismatch: " + funcName +
                                                        " requires type array at position " + std::to_string(i + 1));
                    }
                } else if (types[i] == UNDEFINED) {
                    if (!info[i].IsUndefined()) {
                        throw Napi::TypeError::New(env, "Argument type mismatch: " + funcName +
                                                        " requires type undefined at position " + std::to_string(i + 1));
                    }
                }
            }
        }

        /**
         * A namespace for conversions
         */
        namespace conversions {
            /**
             * A namespace for checking if custom classes can be converted from and to Napi::Value.
             * Source: https://stackoverflow.com/a/16824239
             */
            namespace classes {
                template<typename, typename T>
                struct has_toNapiValue {
                    static_assert(std::integral_constant<T, false>::value,
                                  "Second template parameter needs to be of function type.");
                };

                // Struct to check if C has function toNapiValue(Args...)
                template<typename C, typename Ret, typename... Args>
                struct has_toNapiValue<C, Ret(Args...)> {
                private:
                    template<typename T>
                    static constexpr auto check(T *)
                    -> typename std::is_same<decltype(T::toNapiValue(std::declval<Args>()...)), Ret>::type;

                    template<typename>
                    static constexpr std::false_type check(...);

                    typedef decltype(check<C>(0)) type;

                public:
                    static constexpr bool value = type::value;
                };

                template<typename, typename T>
                struct has_fromNapiValue {
                    static_assert(std::integral_constant<T, false>::value,
                                  "Second template parameter needs to be of function type.");
                };

                // Struct to check if C has function fromNapiValue(Args...)
                template<typename C, typename Ret, typename... Args>
                struct has_fromNapiValue<C, Ret(Args...)> {
                private:
                    template<typename T>
                    static constexpr auto check(T *)
                    -> typename std::is_same<decltype(T::fromNapiValue(std::declval<Args>()...)), Ret>::type;

                    template<typename>
                    static constexpr std::false_type check(...);

                    typedef decltype(check<C>(0)) type;

                public:
                    static constexpr bool value = type::value;
                };
            } // namespace classes

            /**
             * Check if Args... is any of T
             *
             * @tparam T the type to check against
             * @tparam Args the types to check
             */
            template<class T, class...Args>
            static constexpr bool is_any_of = std::disjunction_v<std::is_same<T, Args>...>;

            /**
             * A type converter to convert to cpp values
             */
            template<class>
            struct toCpp;

            /**
             * Convert a Napi::Value to any type
             *
             * @tparam T the type to convert to
             */
            template<class T>
            struct toCpp {
                /**
                 * Convert the value
                 *
                 * @param val the value to convert
                 * @return the resulting value of type T
                 */
                static T convert(const Napi::Value &val) {
                    if constexpr (classes::has_fromNapiValue<T, T(Napi::Value)>::value) {
                        return T::fromNapiValue(val);
                    } else if constexpr (is_any_of<T, int8_t, int16_t, int32_t, int64_t, uint8_t, uint16_t, uint32_t, uint64_t>) {
                        if (!val.IsNumber()) throw std::runtime_error("The given type is not a number");
                        else return val.ToNumber();
                    } else if constexpr (is_any_of<T, std::string, const char *>) {
                        if (!val.IsString()) throw std::runtime_error("The given type is not a string");
                        else return val.ToString();
                    } else if constexpr (is_any_of<T, bool>) {
                        if (!val.IsBoolean()) throw std::runtime_error("The given type is not a boolean");
                        else return val.ToBoolean();
                    }
                }
            };

            /**
             * Convert a Napi::Array to a std::vector
             *
             * @tparam T the vector type
             */
            template<class T>
            struct toCpp<std::vector<T>> {
                /**
                 * Convert the value
                 *
                 * @param val the value to convert
                 * @return the resulting std::vector
                 */
                static std::vector<T> convert(const Napi::Value &val) {
                    if (!val.IsArray()) throw std::runtime_error("The value supplied must be an array");

                    std::vector<T> vec;
                    auto arr = val.As<Napi::Array>();
                    for (int i = 0; i < arr.Length(); i++) {
                        vec.push_back(toCpp<T>::convert(arr.Get(i)));
                    }

                    return vec;
                }
            };

            /**
             * Convert a Napi::Object to a std::map
             *
             * @tparam T the map key type
             * @tparam U the map value type
             */
            template<class T, class U>
            struct toCpp<std::map<T, U>> {
                /**
                 * Convert the value
                 *
                 * @param val the value to convert
                 * @return the resulting std::map
                 */
                static std::map<T, U> convert(const Napi::Value &val) {
                    if (!val.IsObject()) throw std::runtime_error("The value supplied must be an object");

                    std::map<T, U> map;
                    Napi::Object obj = val.ToObject();
                    std::vector<T> keys = toCpp<std::vector<T>>::convert(obj.GetPropertyNames());

                    for (const auto &key : keys) {
                        map.push(std::pair<T, U>(key, toCpp<U>::convert(obj.Get(key))));
                    }

                    return map;
                }
            };

            /**
             * Convert a Napi::Value to any cpp type
             *
             * @tparam T the type to convert to
             * @param val the value to convert
             * @return the converted value
             */
            template<class T>
            static T convertToCpp(const Napi::Value &val) {
                return toCpp<T>::convert(val);
            }

            /**
             * Convert a c++ value to Napi::Value
             *
             * @tparam T the value type to convert
             * @param env the environment to run in
             * @param cppVal the c++ value to convert
             * @return the Napi::Value
             */
            template<class T>
            static Napi::Value cppValToValue(const Napi::Env &env, const T &cppVal) {
                if constexpr (classes::has_toNapiValue<T, Napi::Value(Napi::Env, T)>::value) {
                    return T::toNapiValue(env, cppVal);
                } else {
                    return Napi::Value::From(env, cppVal);
                }
            }

            /**
             * Convert a std::vector to Napi::Value
             *
             * @tparam T the vector type
             * @param env the environment to run in
             * @param vec the vector to convert
             * @return the Napi::Value
             */
            template<class T>
            static Napi::Value cppValToValue(const Napi::Env &env, const std::vector<T> &vec) {
                uint32_t v_s = (uint32_t) vec.size();
                Napi::Array arr = Napi::Array::New(env, v_s);
                for (uint32_t i = 0; i < v_s; i++) {
                    arr.Set(i, cppValToValue(env, vec[i]));
                }

                return arr;
            }

            /**
             * Convert a std::map to Napi::Value
             *
             * @tparam T the mep key type
             * @tparam U the map value type
             * @param env the environment to run in
             * @param map the map to convert
             * @return the Napi::Value
             */
            template<class T, class U>
            static Napi::Value cppValToValue(const Napi::Env &env, const std::map<T, U> &map) {
                Napi::Object obj = Napi::Object::New(env);
                for (const auto &p : map) {
                    obj.Set(cppValToValue(env, p.first), cppValToValue(env, p.second));
                }

                return obj;
            }
        } // namespace conversions
    } // namespace util

    namespace promises {
        /**
         * A class for creating js promises. This class must exist since the original
         * n-api is so bad and cannot provide such a simple behaviour by default. Also,
         * the docs on Promises are worth shit, just as a side note. You will need to
         * look at the examples to find this, why not?
         *
         * Source:
         * https://github.com/nodejs/node-addon-examples/issues/85#issuecomment-583887294
         * Also exists here:
         * https://github.com/nodejs/node-addon-examples/blob/master/async_pi_estimate/node-addon-api/async.cc
         */
        class AsyncWorker : public Napi::AsyncWorker {
        public:
            /**
             * Construct a Promise
             *
             * @param env the environment to work in
             * @param _fn the function to call
             */
            inline explicit AsyncWorker(const Napi::Env &env) : Napi::AsyncWorker(env),
                                                                deferred(Napi::Promise::Deferred::New(env)) {
            }

            /**
             * Get the promise
             *
             * @return a Napi::Promise
             */
            inline Napi::Promise GetPromise() const {
                return deferred.Promise();
            }

        protected:
            /**
             * A default destructor
             */
            inline ~AsyncWorker() override = default;

            virtual void Run() = 0;

            /**
             * The execution thread
             */
            inline void Execute() override {
                try {
                    Run();
                    std::this_thread::sleep_for(std::chrono::milliseconds(100));
                } catch (std::exception &e) {
                    Napi::AsyncWorker::SetError(e.what());
                } catch (...) {
                    Napi::AsyncWorker::SetError("An unknown error occurred");
                }
            }

            /**
             * Default on ok
             */
            inline virtual void OnOK() override {
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

            Napi::Promise::Deferred deferred;
        };

        /**
         * A class for creating Promises with return types
         *
         * @tparam T the return type of the operation
         */
        template<typename T>
        class promiseCreator : public AsyncWorker {
        public:
            /**
             * Construct a Promise
             *
             * @param env the environment to work in
             * @param _fn the function to call
             */
            inline promiseCreator(const Napi::Env &env, std::function<T()> _fn) : AsyncWorker(env),
                                                                                  fn(std::move(_fn)) {}

        protected:
            /**
             * A default destructor
             */
            inline ~promiseCreator() override = default;

            /**
             * The execution thread
             */
            inline void Run() override {
                val = fn();
            }

            /**
             * On ok
             */
            inline void OnOK() override {
                deferred.Resolve(::napi_tools::util::conversions::cppValToValue(Env(), val));
            };

        private:
            std::function<T()> fn;
            T val;
        };

        /**
         * A class for creating Promises with no return type
         */
        template<>
        class promiseCreator<void> : public AsyncWorker {
        public:
            /**
             * Construct a Promise
             *
             * @param env the environment to work in
             * @param _fn the function to call
             */
            inline promiseCreator(const Napi::Env &env, std::function<void()> _fn) : AsyncWorker(env),
                                                                                     fn(std::move(_fn)) {}

        protected:
            /**
             * A default destructor
             */
            inline ~promiseCreator() override = default;

            /**
             * The run function
             */
            inline void Run() override {
                fn();
            }

        private:
            std::function<void()> fn;
        };

        /**
         * A class for creating promises
         *
         * @tparam T the return type of the promise
         */
        template<class T>
        class promise {
        public:
            /**
             * Create a promise
             *
             * @param env the environment to run in
             * @param fn the promise function to call
             */
            promise(const Napi::Env &env, const std::function<T()> &fn) {
                pr = new promiseCreator<T>(env, fn);
                pr->Queue();
            }

            /**
             * Get the Napi::Promise
             *
             * @return the Napi::Promise
             */
            [[nodiscard]] inline Napi::Promise getPromise() const {
                return pr->GetPromise();
            }

            /**
             * Get the Napi::Promise
             *
             * @return the Napi::Promise
             */
            [[nodiscard]] inline operator Napi::Promise() const {
                return this->getPromise();
            }

            /**
             * Get the Napi::Promise as a value
             *
             * @return the Napi::Value
             */
            [[nodiscard]] inline operator Napi::Value() const {
                return this->getPromise();
            }

            /**
             * A default destructor
             */
            inline ~promise() noexcept = default;

        private:
            promiseCreator<T> *pr;
        };

        /**
         * A class for creating void promises
         */
        template<>
        class promise<void> {
        public:
            /**
             * Create a promise
             *
             * @param env the environment to run in
             * @param fn the promise function to call
             */
            inline promise(const Napi::Env &env, const std::function<void()> &fn) {
                pr = new promiseCreator<void>(env, fn);
                pr->Queue();
            }

            /**
             * Get the Napi::Promise
             *
             * @return the Napi::Promise
             */
            [[nodiscard]] inline Napi::Promise getPromise() const {
                return pr->GetPromise();
            }

            /**
             * Get the Napi::Promise
             *
             * @return the Napi::Promise
             */
            [[nodiscard]] inline operator Napi::Promise() const {
                return this->getPromise();
            }

            /**
             * Get the Napi::Promise as a value
             *
             * @return the Napi::Value
             */
            [[nodiscard]] inline operator Napi::Value() const {
                return this->getPromise();
            }

            /**
             * A default destructor
             */
            inline ~promise() noexcept = default;

        private:
            promiseCreator<void> *pr;
        };
    } // namespace promises

    /**
     * A namespace for callbacks
     */
    namespace callbacks {
        /**
         * Utility namespace
         */
        namespace util {
            /**
             * The callback template
             *
             * @tparam T the javascriptCallback class type
             */
            template<class T>
            class callback_template {
            public:
                /**
                 * Construct an empty callback function.
                 * Will throw an exception when trying to call.
                 */
                inline callback_template() noexcept: ptr(nullptr) {}

                /**
                 * Construct an empty callback function.
                 * Will throw an exception when trying to call.
                 */
                inline callback_template(std::nullptr_t) noexcept: ptr(nullptr) {}

                /**
                 * Construct a callback function
                 *
                 * @param info the CallbackInfo with typeof info[0] == 'function'
                 */
                inline explicit callback_template(const Napi::CallbackInfo &info) : ptr(new wrapper(info)) {}

                /**
                 * Get the underlying promise
                 *
                 * @return the promise
                 */
                [[nodiscard]] inline Napi::Promise getPromise() const {
                    if (ptr && !ptr->stopped) {
                        return ptr->fn->getPromise();
                    } else {
                        throw std::runtime_error("Callback was never initialized");
                    }
                }

                /**
                 * Get the underlying promise
                 *
                 * @return the promise
                 */
                [[nodiscard]] inline operator Napi::Promise() const {
                    return this->getPromise();
                }

                /**
                 * Get the underlying promise
                 *
                 * @return the promise
                 */
                [[nodiscard]] inline operator Napi::Value() const {
                    return this->operator Napi::Promise();
                }

                /**
                 * Check if the promise is initialized and not stopped
                 * 
                 * @return true, if initialized and running
                 */
                inline operator bool() const {
                    return ptr && !ptr->stopped;
                }

                /**
                 * Check if the promise is not initialized or stopped
                 * 
                 * @return true, if not initialized or is stopped
                 */
                inline bool stopped() const {
                    return !ptr || ptr->stopped;
                }

                /**
                 * Stop the callback function and deallocate all resources
                 */
                inline void stop() {
                    if (ptr && !ptr->stopped) {
                        ptr->fn->stop();
                        ptr->stopped = true;
                    }
                }

                /**
                 * Default destructor
                 */
                inline ~callback_template() noexcept = default;

            protected:
                /**
                 * A class for wrapping around the javascriptCallback class
                 */
                class wrapper {
                public:
                    /**
                     * Create a wrapper instance
                     *
                     * @param info the callbackInfo to construct the callback
                     */
                    inline wrapper(const Napi::CallbackInfo &info) : fn(new T(info)),
                                                                     stopped(false) {}

                    /**
                     * Stop the callback
                     */
                    inline ~wrapper() {
                        if (!stopped) fn->stop();
                        std::this_thread::sleep_for(std::chrono::milliseconds(50));
                    }

                    T *fn;
                    bool stopped;
                };

                /**
                 * The ptr holding the wrapper
                 */
                std::shared_ptr<wrapper> ptr;
            };
        } // namespace util

        /**
         * A javascript callback
         */
        template<class>
        class javascriptCallback;

        /**
         * A javascript callback with return type
         *
         * @tparam R the return type
         * @tparam A the argument types
         */
        template<class R, class...A>
        class javascriptCallback<R(A...)> {
        public:
            /**
             * Create a javascript callback
             *
             * @param info the callback info
             */
            explicit inline javascriptCallback(const Napi::CallbackInfo &info) : deferred(
                    Napi::Promise::Deferred::New(info.Env())), mtx() {
                CHECK_ARGS(::napi_tools::napi_type::FUNCTION);
                Napi::Env env = info.Env();

                run = true;

                // Create a new ThreadSafeFunction.
                this->ts_fn =
                        Napi::ThreadSafeFunction::New(env, info[0].As<Napi::Function>(), "javascriptCallback", 0, 1,
                                                      this, FinalizerCallback < R, A... >, (void *) nullptr);
                this->nativeThread = std::thread(threadEntry < R, A... >, this);
            }

            /**
             * Async call the javascript function
             *
             * @param values the values to pass to the function
             * @param func the callback function
             */
            inline void asyncCall(A &&...values, const std::function<void(R)> &func) {
                mtx.lock();
                queue.push_back(new args(std::forward<A>(values)..., func));
                mtx.unlock();
            }

            /**
             * Get the promise
             *
             * @return the Napi::Promise
             */
            [[nodiscard]] inline Napi::Promise getPromise() const {
                return deferred.Promise();
            }

            /**
             * Stop the function
             */
            inline void stop() {
                run = false;
                mtx.unlock();
            }

        private:
            /**
             * A class for storing arguments
             */
            class args {
            public:
                /**
                 * Create a new args instance
                 *
                 * @param values the values to store
                 * @param func the callback function
                 */
                inline args(A &&...values, const std::function<void(R)> &func) : args_t(std::forward<A>(values)...),
                                                                                 fun(func) {}

                /**
                 * Convert the args to a napi_value vector.
                 * Source: https://stackoverflow.com/a/42495119
                 *
                 * @param env the environment to work in
                 * @return the value vector
                 */
                inline std::vector<napi_value> to_vector(const Napi::Env &env) {
                    return std::apply([&env](auto &&... el) {
                        return std::vector<napi_value>{
                                ::napi_tools::util::conversions::cppValToValue(env, std::forward<decltype(el)>(el))...};
                    }, std::forward<std::tuple<A...>>(args_t));
                }

                std::function<void(R)> fun;
            private:
                std::tuple<A...> args_t;
            };

            // The thread entry
            template<class U, class...Args>
            static void threadEntry(javascriptCallback<U(Args...)> *jsCallback) {
                // The callback function
                const auto callback = [](const Napi::Env &env, const Napi::Function &jsCallback, args *data) {
                    Napi::Value val = jsCallback.Call(data->to_vector(env));

                    try {
                        U ret = ::napi_tools::util::conversions::convertToCpp<U>(val);
                        data->fun(ret);
                    } catch (std::exception &e) {
                        std::cerr << __FILE__ << ":" << __LINE__ << " Exception thrown: " << e.what() << std::endl;
                    } catch (...) {
                        std::cerr << __FILE__ << ":" << __LINE__ << " Unknown exception thrown" << std::endl;
                    }
                    delete data;
                };

                while (jsCallback->run) {
                    // Lock the mutex
                    jsCallback->mtx.lock();
                    // Check if run is still true.
                    // Run may be false as the mutex is unlocked when stop() is called
                    if (jsCallback->run) {
                        for (args *ar : jsCallback->queue) {
                            // Copy the arguments
                            auto *a = new args(*ar);
                            delete ar;

                            // Call the callback
                            napi_status status = jsCallback->ts_fn.BlockingCall(a, callback);

                            if (status != napi_ok) {
                                Napi::Error::Fatal("ThreadEntry",
                                                   "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
                            }
                        }

                        // Clear the queue and unlock the mutex
                        jsCallback->queue.clear();
                        jsCallback->mtx.unlock();

                        std::this_thread::sleep_for(std::chrono::milliseconds(NAPI_TOOLS_CALLBACK_SLEEP_TIME));
                    } else {
                        jsCallback->mtx.unlock();
                    }
                }

                jsCallback->ts_fn.Release();
            }

            // The finalizer callback
            template<class U, class...Args>
            static void FinalizerCallback(const Napi::Env &env, void *, javascriptCallback<U(Args...)> *jsCallback) {
                // Join the native thread and resolve the promise
                jsCallback->nativeThread.join();
                jsCallback->deferred.Resolve(env.Null());

                delete jsCallback;
            }

            /**
             * The destructor
             */
            ~javascriptCallback() {
                mtx.lock();
                for (args *a : queue) {
                    delete a;
                }
            }

            bool run; // Whether the callback thread should run
            std::mutex mtx;
            std::vector<args *> queue;
            const Napi::Promise::Deferred deferred;
            std::thread nativeThread;
            Napi::ThreadSafeFunction ts_fn;
        };

        /**
         * A void javascript callback
         *
         * @tparam A the argument types
         */
        template<class...A>
        class javascriptCallback<void(A...)> {
        public:
            /**
             * Create a javascript callback
             *
             * @param info the CallbackInfo. info[0] must be a napi function
             */
            explicit inline javascriptCallback(const Napi::CallbackInfo &info) : deferred(
                    Napi::Promise::Deferred::New(info.Env())), queue(), mtx() {
                CHECK_ARGS(::napi_tools::napi_type::FUNCTION);
                Napi::Env env = info.Env();

                run = true;

                // Create a new ThreadSafeFunction.
                this->ts_fn = Napi::ThreadSafeFunction::New(env, info[0].As<Napi::Function>(), "javascriptCallback", 0,
                                                            1, this,
                                                            FinalizerCallback<A...>, (void *) nullptr);
                this->nativeThread = std::thread(threadEntry<A...>, this);
            }

            /**
             * Async call the function
             *
             * @param values the values to pass
             */
            inline void asyncCall(A &&...values) {
                mtx.lock();
                queue.push_back(args(std::forward<A>(values)...));
                mtx.unlock();
            }

            /**
             * Get the napi promise
             *
             * @return the promise
             */
            [[nodiscard]] inline Napi::Promise getPromise() const {
                return deferred.Promise();
            }

            /**
             * Stop the function and deallocate all ressources
             */
            inline void stop() {
                run = false;
                mtx.unlock();
            }

        private:
            /**
             * A class for storing agtruments
             */
            class args {
            public:
                /**
                 * Create the args class
                 *
                 * @param values the values to store
                 */
                args(A &&...values) : args_t(std::forward<A>(values)...) {}

                /**
                 * Convert the args to a napi_value vector.
                 * Source: https://stackoverflow.com/a/42495119
                 *
                 * @param env the environment to work in
                 * @return the value vector
                 */
                inline std::vector<napi_value> to_vector(const Napi::Env &env) {
                    return std::apply([&env](auto &&... el) {
                        return std::vector<napi_value>{
                                ::napi_tools::util::conversions::cppValToValue(env, std::forward<decltype(el)>(el))...};
                    }, std::forward<std::tuple<A...>>(args_t));
                }

            private:
                std::tuple<A...> args_t;
            };

            // The thread entry
            template<class...Args>
            static void threadEntry(javascriptCallback<void(Args...)> *jsCallback) {
                // A callback function
                const auto callback = [](const Napi::Env &env, const Napi::Function &jsCallback, args *data) {
                    jsCallback.Call(data->to_vector(env));
                    delete data;
                };

                while (jsCallback->run) {
                    jsCallback->mtx.lock();
                    // Check if run is still true,
                    // as the mutex is unlocked when stop() is called
                    if (jsCallback->run) {
                        // Go through all args in the queue
                        for (const args &val : jsCallback->queue) {
                            // Copy the args class
                            args *tmp = new args(val);

                            // Call the callback
                            napi_status status = jsCallback->ts_fn.BlockingCall(tmp, callback);

                            // Check the status
                            if (status != napi_ok) {
                                Napi::Error::Fatal("ThreadEntry",
                                                   "Napi::ThreadSafeNapi::Function.BlockingCall() failed");
                            }
                        }

                        // Clear the queue
                        jsCallback->queue.clear();
                        jsCallback->mtx.unlock();

                        // Sleep for some time
                        std::this_thread::sleep_for(std::chrono::milliseconds(NAPI_TOOLS_CALLBACK_SLEEP_TIME));
                    } else {
                        jsCallback->mtx.unlock();
                    }
                }

                // Release the thread-safe function
                jsCallback->ts_fn.Release();
            }

            // The finalizer callback
            template<class...Args>
            static void FinalizerCallback(const Napi::Env &env, void *, javascriptCallback<void(Args...)> *jsCallback) {
                // Join the native thread and resolve the promise
                jsCallback->nativeThread.join();
                jsCallback->deferred.Resolve(env.Null());

                delete jsCallback;
            }

            // Default destructor
            ~javascriptCallback() noexcept = default;

            bool run;
            std::mutex mtx;
            std::vector<args> queue;
            const Napi::Promise::Deferred deferred;
            std::thread nativeThread;
            Napi::ThreadSafeFunction ts_fn;
        };

        /**
         * A class for creating javascript callbacks
         */
        template<class>
        class callback;

        /**
         * A void javascript callback
         *
         * @tparam Args the argument types
         */
        template<class...Args>
        class callback<void(Args...)> : public util::callback_template<javascriptCallback<void(Args...)>> {
        public:
            using cb_template = util::callback_template<javascriptCallback<void(Args...)>>;
            using cb_template::cb_template;

            /**
             * Call the javascript function. Async call
             *
             * @param args the function arguments
             */
            inline void operator()(Args...args) {
                if (this->ptr && !this->ptr->stopped) {
                    this->ptr->fn->asyncCall(std::forward<Args>(args)...);
                } else {
                    throw std::runtime_error("Callback was never initialized");
                }
            }
        };

        /**
         * A non-void javascript callback
         *
         * @tparam R the return type
         * @tparam Args the argument types
         */
        template<class R, class...Args>
        class callback<R(Args...)> : public util::callback_template<javascriptCallback<R(Args...)>> {
        public:
            using cb_template = util::callback_template<javascriptCallback<R(Args...)>>;
            using cb_template::cb_template;

            /**
             * Call the javascript function async.
             *
             * @param args the function arguments
             * @param callback the callback function to be called, as this is async
             */
            inline void operator()(Args...args, const std::function<void(R)> &callback) {
                if (this->ptr && !this->ptr->stopped) {
                    this->ptr->fn->asyncCall(std::forward<Args>(args)..., callback);
                } else {
                    throw std::runtime_error("Callback was never initialized");
                }
            }

            /**
             * Call the javascript function.
             * Example usage:<br>
             *
             * <p><code>
             * std::promise&lt;int&gt; promise = callback();<br>
             * std::future&lt;int&gt; fut = promise.get_future();<br>
             * fut.wait();<br>
             * int res = fut.get();
             * </code></p>
             *
             * @param args the function arguments
             * @return a promise to be resolved
             */
            inline std::promise<R> operator()(Args...args) {
                std::promise<R> promise;
                this->operator()(args..., [&promise](const R &val) {
                    promise.set_value(val);
                });

                return promise;
            }

            /**
             * Call the javascript function with a supplied promise.
             * Example:<br>
             *
             * <p><code>
             * std::promise&lt;int&gt; promise;<br>
             * callback(promise);<br>
             * std::future&lt;int&gt; future = promise.get_future();<br>
             * int res = future.get();
             * </p></code>
             *
             * @param args the function arguments
             * @param promise the promise to be resolved
             */
            inline void operator()(Args...args, std::promise<R> &promise) {
                this->operator()(args..., [&promise](const R &val) {
                    promise.set_value(val);
                });
            }
        };
    } // namespace callbacks
} // namespace napi_tools
#endif // NAPI_TOOLS_NAPI_TOOLS_HPP
