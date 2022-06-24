#ifndef AUTOBETLIB_NAPI_EXPORTED_HPP
#define AUTOBETLIB_NAPI_EXPORTED_HPP

#include <string>
#include <vector>
#include <future>

namespace napi_exported {
    /**
     * Quit the node.js process
     */
    void node_quit();

    /**
     * Log through the javascript process
     *
     * @param val the value to log
     */
    void node_log(const std::string &val);

    void stopCallbacks();

    bool isBettingFunctionSet();

    std::string getAutobetlibVersion();

    void setGtaRunning(bool);

    std::future<int> getBettingPosition(const std::vector<std::string> &);

    void setAllMoneyMade(int);

    void addMoney(int);

    void keyCombStart();

    void keyCombStop();

    void bettingException(const std::string &);

    void exception();
}

#endif //AUTOBETLIB_NAPI_EXPORTED_HPP
