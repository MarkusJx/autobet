import logging
import wuy

_start_function = None
_stop_function = None
_get_money_function = None
_get_all_money_function = None
_get_races_won_function = None
_get_races_lost_function = None
_get_time_function = None
_get_running_function = None

_initialized = False


def initialized():
    global _initialized
    _initialized = True


def start():
    wuy.Server.run(port=8027)


class main(wuy.Server):
    # js exposed functions
    def js_start(self):
        if callable(_start_function):
            _start_function()
        else:
            self._pass()
            logging.error("start_function not defined")

    def js_stop(self):
        if callable(_stop_function):
            _stop_function()
        else:
            self._pass()
            logging.error("stop_function not defined")

    def js_get_money(self):
        if callable(_get_money_function):
            return _get_money_function()
        else:
            self._pass()
            logging.error("get_money_function not defined")

    def js_get_all_money(self):
        if callable(_get_all_money_function):
            return _get_all_money_function()
        else:
            self._pass()
            logging.error("get_all_money_function not defined")

    def get_races_won(self):
        if callable(_get_races_won_function):
            return _get_races_won_function()
        else:
            self._pass()
            logging.error("races_won_function not defined")

    def get_races_lost(self):
        if callable(_get_races_lost_function):
            return _get_races_lost_function()
        else:
            self._pass()
            logging.error("races_lost_function not defined")

    def js_get_time(self):
        if callable(_get_time_function):
            return _get_time_function()
        else:
            self._pass()
            logging.error("get_time_function not defined")

    def js_get_running(self):
        if callable(_get_running_function):
            return _get_running_function()
        else:
            self._pass()
            logging.error("get_running_function not defined")

    def connected(self):
        self._pass()
        return True

    def js_initialized(self):
        self._pass()
        return _initialized

    def _pass(self):
        pass


class index(wuy.Server):
    def js_initialized(self):
        self._pass()
        return _initialized

    def connected(self):
        self._pass()
        return True

    def _pass(self):
        pass


def set_functions(start_function, stop_function, get_money_function, get_all_money_function,
                  get_races_won_function, get_races_lost_function, get_time_function, get_running_function):
    global _start_function, _stop_function, _get_money_function, _get_all_money_function
    global _get_races_won_function, _get_races_lost_function, _get_time_function, _get_running_function
    _start_function = start_function
    _stop_function = stop_function
    _get_money_function = get_money_function
    _get_all_money_function = get_all_money_function
    _get_races_won_function = get_races_won_function
    _get_races_lost_function = get_races_lost_function
    _get_time_function = get_time_function
    _get_running_function = get_running_function
