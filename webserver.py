import wuy
import customlogger

_start_function = None
_stop_function = None
_get_money_function = None
_get_all_money_function = None
_get_races_won_function = None
_get_races_lost_function = None
_get_time_function = None
_get_running_function = None
_get_gta_v_running_function = None

_initialized = False

logger = customlogger.create_logger("webserver", mode=customlogger.FILE)

autostop_money = -1
autostop_time = -1


def initialized():
    global _initialized
    logger.debug("Initialized set to true")
    _initialized = True


def check_stop_conditions():
    global autostop_time, autostop_money
    if not callable(_get_time_function):
        logger.error("get_time_function not defined")
        return

    if not callable(_get_money_function):
        logger.error("get_money_function not defined")
        return

    if autostop_time != -1 and autostop_time > _get_time_function():
        if callable(_stop_function):
            autostop_money = -1
            autostop_time = -1
            _stop_function()
            logger.debug("Stopped because an autostop condition was reached: Time")
        else:
            logger.error("stop_function not defined")
    elif autostop_money != -1 and _get_money_function() > autostop_money:
        if callable(_stop_function):
            autostop_money = -1
            autostop_time = -1
            _stop_function()
            logger.debug("Stopped because an autostop condition was reached: Money")
        else:
            logger.error("stop_function not defined")


def start():
    logger.debug("Starting web server")
    wuy.Server.run(port=8027)


class main(wuy.Server):
    # js exposed functions
    def js_start(self):
        if callable(_start_function):
            try:
                _start_function()
            except Exception as e:
                logger.exception(e)
        else:
            self._pass()
            logger.error("start_function not defined")

    def js_stop(self):
        if callable(_stop_function):
            try:
                _stop_function()
            except Exception as e:
                logger.exception(e)
        else:
            self._pass()
            logger.error("stop_function not defined")

    def js_get_money(self):
        if callable(_get_money_function):
            try:
                return _get_money_function()
            except Exception as e:
                logger.exception(e)
                return -1
        else:
            self._pass()
            logger.error("get_money_function not defined")

    def js_get_all_money(self):
        if callable(_get_all_money_function):
            try:
                return _get_all_money_function()
            except Exception as e:
                logger.exception(e)
                return -1
        else:
            self._pass()
            logger.error("get_all_money_function not defined")

    def get_races_won(self):
        if callable(_get_races_won_function):
            try:
                return _get_races_won_function()
            except Exception as e:
                logger.exception(e)
                return -1
        else:
            self._pass()
            logger.error("races_won_function not defined")

    def get_races_lost(self):
        if callable(_get_races_lost_function):
            try:
                return _get_races_lost_function()
            except Exception as e:
                logger.exception(e)
                return -1
        else:
            self._pass()
            logger.error("races_lost_function not defined")

    def js_get_time(self):
        if callable(_get_time_function):
            try:
                return _get_time_function()
            except Exception as e:
                logger.exception(e)
                return -1
        else:
            self._pass()
            logger.error("get_time_function not defined")

    def js_get_running(self):
        if callable(_get_running_function):
            try:
                return _get_running_function()
            except Exception as e:
                logger.exception(e)
                return -2
        else:
            self._pass()
            logger.error("get_running_function not defined")

    def get_gta_v_running(self):
        if callable(_get_gta_v_running_function):
            try:
                return _get_gta_v_running_function()
            except Exception as e:
                logger.exception(e)
                return -1
        else:
            self._pass()
            logger.error("get_gta_v_running_function not defined")

    def set_autostop_money(self, val):
        global autostop_money
        autostop_money = int(val)
        self._pass()

    def get_autostop_money(self):
        self._pass()
        return autostop_money

    def set_autostop_time(self, val):
        global autostop_time
        autostop_time = int(val)
        self._pass()

    def get_autostop_time(self):
        self._pass()
        check_stop_conditions()
        return autostop_time

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
                  get_races_won_function, get_races_lost_function, get_time_function, get_running_function,
                  get_gta_v_running_function):
    global _start_function, _stop_function, _get_money_function, _get_all_money_function
    global _get_races_won_function, _get_races_lost_function, _get_time_function, _get_running_function
    global _get_gta_v_running_function
    logger.debug("Setting functions for web server")
    _start_function = start_function
    _stop_function = stop_function
    _get_money_function = get_money_function
    _get_all_money_function = get_all_money_function
    _get_races_won_function = get_races_won_function
    _get_races_lost_function = get_races_lost_function
    _get_time_function = get_time_function
    _get_running_function = get_running_function
    _get_gta_v_running_function = get_gta_v_running_function
