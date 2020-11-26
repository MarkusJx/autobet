#ifndef AUTOBET_NAPI_TOOLS_HPP
#define AUTOBET_NAPI_TOOLS_HPP

#include <napi.h>

//#define call(name, object, ...) Get(name).As<Napi::Function>().Call(object, {__VA_ARGS__})
//#define create(...) As<Napi::Function>().New({__VA_ARGS__})

#define TRY try {
#define CATCH_EXCEPTIONS } catch (const std::exception &e) {throw Napi::Error::New(info.Env(), e.what());}\
        catch (...) {throw Napi::Error::New(info.Env(), "An unknown error occurred");}

#define CHECK_ARGS(...) ::napi_tools::util::checkArgs(info, ::napi_tools::util::removeNamespace(__FUNCTION__), {__VA_ARGS__})
#define CHECK_LENGTH(len) if (info.Length() != len) throw Napi::TypeError::New(info.Env(), \
        ::napi_tools::util::removeNamespace(__FUNCTION__) + " requires " + std::to_string(len) + " arguments")

namespace napi_tools {
    enum type {
        STRING,
        NUMBER,
        FUNCTION,
        OBJECT,
        BOOLEAN,
        ARRAY
    };

    /**
     * Utility namespace
     */
    namespace util {
        inline std::string removeNamespace(const std::string &str) {
            return str.substr(str.rfind(':') + 1);
        }

        inline void
        checkArgs(const Napi::CallbackInfo &info, const std::string &funcName, const std::vector<type> &types) {
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
                }
            }
        }
    }
}
#endif //AUTOBET_NAPI_TOOLS_HPP
