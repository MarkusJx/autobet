import win32gui

import customlogger
customlogger.delete_old_log()
logger = customlogger.create_logger("autobet", mode=customlogger.FILE)

try:
    import os
    import threading
    from subprocess import Popen, PIPE

    import eel
    import numpy as np
    import pyautogui
    import win32api
    import win32con
    from PIL import ImageGrab
    from system_hotkey import SystemHotkey
    from win32process import DETACHED_PROCESS
    import webserver
    import logging
    import socket
    import shutil
    import ctypes

    import ai
    from utils import get_window_size, window_open
except Exception as ex:
    logger.exception(ex)
    os._exit(1)

winnings = 0
winnings_all = 0
main_defined = False

running = False
stopping = False
starting = False
eel_running = False
initializing = False
run_main = True
gta_v_running = False

xPos = 0
yPos = 0
multiplierW = 0
multiplierH = 0
width = 0
height = 0

thread = None
betting_ai = None
winnings_ai = None
winnings_ai_con = None

races_won = 0
races_lost = 0
time_running = 0

dummy = False
debug = False

yLocations = 464, 628, 790, 952, 1114, 1276


def set_positions():
    logging.debug("Getting positions of GTA V window")
    global xPos, yPos, multiplierH, multiplierW, width, height
    # Definition of width, height, x, y pos of window and multiplier of positions
    xPos, yPos, width, height = get_window_size("Grand Theft Auto V")
    multiplierW = width / 2560
    multiplierH = height / 1440

    # Set x and y pos to 0 if they are below 0. This happens when a window is maximised
    if xPos < 0:
        xPos = 0

    if yPos < 0:
        yPos = 0


# click functions -----------------------------------------------------------------------------------------------------
def click(x, y, move=True, right=False):
    if not stopping and not debug:
        x = round(x * multiplierW + xPos)
        y = round(y * multiplierH + yPos)

        if move:
            pyautogui.moveTo(x, y, duration=0.25)
            ctypes.windll.user32.SetCursorPos(x, y)
            x1, y1 = win32gui.GetCursorPos()
            if x1 != x or y1 != y:
                logger.critical("Mouse did not move! Exiting.")
                eel.exception()

        if right:
            win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTDOWN, x, y, 0, 0)
        else:
            win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, x, y, 0, 0)

        eel.sleep(0.25)

        if right:
            win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTUP, x, y, 0, 0)
        else:
            win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, x, y, 0, 0)


def right_click(x, y, move=True):
    click(x, y, move, right=True)


def place_bet(y):
    logging.debug("Placing bet")
    click(634, y)

    click(2028, 680)
    for x in range(32):
        click(2028, 680, move=False)

    click(1765, 1050)


def reset():
    click(1286, 1304)

    click(1905, 1187)


# ---------------------------------------------------------------------------------------------------------------------


# main ----------------------------------------------------------------------------------------------------------------
def start_main_f():
    try:
        main_f()
    except Exception as e:
        logger.exception(e)

# img size: 110 x 46


# GTA Online version 1.49 fix
def get_pos(_betting_ai, img):
    res = [-1, -1, -1, -1, -1, -1]
    for i in range(0, 5):
        y1 = round(yLocations[i] * multiplierH)
        y2 = round((yLocations[i] + 46) * multiplierH)
        x1 = round(240 * multiplierW)
        x2 = round(350 * multiplierW)
        crop_img = img[y1:y2, x1:x2]
        b_res = _betting_ai.usable(crop_img)
        if (b_res != 10 and b_res in res) or b_res == 1:
            return -1

        res[i] = b_res

    lowest = None
    for i in range(0, 5):
        if lowest is None or lowest[0] > res[i]:
            lowest = [res[i], i]

    return yLocations[lowest[1]]


def main_f():
    global betting_ai, initializing, stopping, running
    logging.debug("Started main thread")
    betting_ai = ai.Betting()
    logging.debug("Betting AI initialized")
    initializing = False
    counter = 0
    while run_main:
        if window_open("Grand Theft Auto V"):
            if (counter % 20) == 0:  # Set only every 10 seconds
                logger.debug("GTA V running")
                set_gta_v_running(True)
                set_positions()
                if winnings_ai_con is not None:
                    try:
                        set_winnings_positions()
                    except Exception:
                        logger.warn("Could not send positions to winnings, this might not be an error")
                counter = 1
            else:
                counter += 1
        else:
            logger.debug("GTA V not running")
            if running and stopping:
                stopping = False
                running = False
            eel.sleep(10)
            set_gta_v_running(False)
            continue

        def _run_main():
            while running:
                screen = ImageGrab.grab(bbox=(xPos, yPos, width, height))
                pos = get_pos(betting_ai, np.array(screen))
                if pos != -1:
                    if not running:
                        return
                    place_bet(pos)
                    update_winnings(-10000)
                    if not running:
                        return
                    logger.debug("Sleeping for 34 seconds")
                    eel.sleep(17)
                    if not running:
                        logger.debug("The script has been stopped, skipping after 17 seconds...")
                        return
                    eel.sleep(17)
                    if not running:
                        return
                    get_winnings_py()
                    reset()
                else:
                    avoid_kick()
                    logger.debug("Sleeping for 34 seconds")
                    eel.sleep(34)
                    reset()

        if running:
            logger.debug("Starting main loop")
            _run_main()
        stopping = False
        eel.sleep(0.5)
    logger.debug("Stopped main thread")


def start_script():
    global running
    logger.debug("Starting script")
    if not running and not stopping:
        logger.debug("Set running to true")
        running = True


def stop_script():
    global running, stopping
    if running and not stopping:
        logger.debug("Waiting for main thread to finish")
        running = False
        stopping = True


def set_gta_v_running(val):
    global gta_v_running
    gta_v_running = val
    eel.set_gta_running(val)


# ---------------------------------------------------------------------------------------------------------------------


# winnings ------------------------------------------------------------------------------------------------------------
def start_winnings_ai():
    global winnings_ai, winnings_ai_con
    logger.debug("Starting winnings ai")
    if debug:
        logger.warning("Winnings_ai is starting in debug mode")
        winnings_ai = Popen(["python", "winnings.py"])  # used for testing
    else:
        logger.debug("Winnings_ai is starting in production mode")
        winnings_ai = Popen(["winnings/winnings.exe"], stderr=PIPE, stdout=PIPE)
    logger.debug("Starting socket for winnings_ai")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_address = ('localhost', 8026)
    sock.bind(server_address)
    sock.listen(1)
    winnings_ai_con, client_address = sock.accept()
    winnings_ai_con.setblocking(True)
    if client_address[0] != "127.0.0.1":
        logger.critical("A non-local client tried to connect to the server. Closing connection.")
        winnings_ai_con.close()
        winnings_ai_con = None
    logger.debug("Closing server socket")
    sock.close()

    data = winnings_ai_con.recv(4).decode("utf-8")
    if data == "done":
        logger.debug("winnings_ai initialized successfully")
    else:
        logger.debug("winnings_ai returned abnormal signal")
    winnings_ai_con.settimeout(7)


def set_winnings_positions():
    logger.debug("Sending window positions to winnings_ai")
    winnings_ai_con.sendall(int.to_bytes(2, 1, "big"))

    send = str(xPos) + ":" + str(yPos) + ":" + str(width) + ":" + str(height)
    winnings_ai_con.sendall(int.to_bytes(len(send), 1, "big"))
    winnings_ai_con.sendall(bytes(send, "utf-8"))

    if int.from_bytes(winnings_ai_con.recv(1), "big") == 0:
        logger.debug("Positions sent successfully.")
    else:
        logger.error("winnings_ai returned abnormal signal")


def get_winnings_py():
    winnings_ai_con.sendall(int.to_bytes(1, 1, "big"))
    try:
        res = winnings_ai_con.recv(1)
    except Exception:
        logger.error("Could not receive winnings prediction, these won't be accurate from now on")
        return
    res = int.from_bytes(res, "big")

    logger.debug("Results: " + str(res))
    if res == 3:
        logger.debug("30k")
        update_winnings(30000)
        return
    elif res == 4:
        logger.debug("40k")
        update_winnings(40000)
        return
    elif res == 5:
        logger.debug("50k")
        update_winnings(50000)
        return
    elif res == 0:
        logger.debug("zero")
        update_winnings(0)
        return


def update_winnings(to_add):
    logger.debug("Updating winnings by " + str(to_add))
    if to_add != 0:
        global winnings_all, winnings
        winnings += to_add
        winnings_all += to_add

        eel.setAllMoneyMade(winnings_all)

        if to_add > 0:
            global races_won
            races_won += 1
    else:
        global races_lost
        races_lost += 1

    eel.addMoney(to_add)

    logger.debug("Writing winnings to file")
    f = open("winnings.txt", "w")
    f.write(str(winnings_all))
    f.close()


# ---------------------------------------------------------------------------------------------------------------------


# web server functions ------------------------------------------------------------------------------------------------

def wuy_start_script():
    eel.keycomb_start()
    start_script()


def wuy_stop_script():
    eel.keycomb_stop()
    stop_script()


def get_races_won():
    return races_won


def get_races_lost():
    return races_lost


def get_all_winnings():
    return winnings_all


def get_current_winnings():
    return winnings


def get_time():
    return time_running


@eel.expose
def get_gta_running():
    return gta_v_running


def get_running():
    if running and not stopping:  # running
        return 1
    elif starting and not running and not stopping:  # starting
        return 2
    elif not running and not stopping:  # stopped
        return -1
    else:  # stopping
        return 0


# ---------------------------------------------------------------------------------------------------------------------


# miscellaneous -------------------------------------------------------------------------------------------------------
def avoid_kick():
    logger.debug("Should not bet on this one, skipping...")
    click(633, 448)
    click(1720, 1036)


def eel_kill(page, sockets):
    logger.debug("Killing program because the UI has been closed")
    if dummy:
        print(page)
        print(sockets)
    kill()


@eel.expose
def kill():
    global run_main
    logger.debug("Killing program")
    if winnings_ai_con is not None:
        logger.debug("Closing winnings_ai connection")
        winnings_ai_con.close()

    if winnings_ai is not None:
        logger.debug("Killing winnings_ai")
        winnings_ai.kill()

    run_main = False

    try:
        logger.debug("Killing UI")
        eel.js_exit()
    finally:
        logger.debug("exit.")
        os._exit(0)


# ---------------------------------------------------------------------------------------------------------------------


# Key combos ----------------------------------------------------------------------------------------------------------
def start_stop():
    if not starting:
        if not running and not stopping:
            if not gta_v_running:
                logger.debug("Tried to start the script while the game was not running, skipping this request")
                return
            eel.keycomb_start()
            start_script()
        else:
            eel.keycomb_stop()
            stop_script()
    else:
        logger.debug("Keycomb to start was triggered, but the 'start' button was already pressed at this time, " +
                     "ignoring the event")


hk1 = SystemHotkey()
hk1.register(('control', 'shift', 'f10'), callback=lambda x: start_stop())

hk2 = SystemHotkey()
hk2.register(('control', 'shift', 'f9'), callback=lambda x: kill())


# ---------------------------------------------------------------------------------------------------------------------


# Eel init ------------------------------------------------------------------------------------------------------------
@eel.expose
def init_ai():
    try:
        global initializing, thread
        logger.debug("Initializing AIs")
        initializing = True
        thread = threading.Thread(target=start_main_f, args=())
        thread.start()
        while initializing:
            eel.sleep(1)
        start_winnings_ai()
        eel.doneLoading()
        webserver.initialized()
        logger.debug("All AIs successfully initialized")
    except Exception as e:
        if eel_running:
            eel.exception()
        logger.exception(e)


@eel.expose
def start_s_function():
    try:
        start_script()
    except Exception as e:
        logger.exception(e)


@eel.expose
def stop_s_function():
    try:
        stop_script()
    except Exception as e:
        logger.exception(e)


@eel.expose
def stopped():
    return not running and not stopping


@eel.expose
def set_starting(val):
    global starting
    logger.debug("Set starting to " + str(val))
    starting = val


@eel.expose
def get_winnings():
    try:
        global winnings_all
        logger.debug("Reading winnings from file")
        try:
            f = open("winnings.txt", "r+")
            s = f.read()
            if s:
                winnings_all = int(s)
                f.close()
        except FileNotFoundError:
            logger.debug("File not found, creating one")
            f = open("winnings.txt", "w")
            f.write("0")
            f.close()
        eel.setAllMoneyMade(winnings_all)
    except Exception as e:
        logger.exception(e)


@eel.expose
def open_website():
    try:
        import webbrowser
        logging.debug("Opening website on " + get_ip())
        webbrowser.open("http://" + get_ip() + ":8027", new=2)
    except Exception as e:
        logger.exception(e)


@eel.expose
def add_sec():
    global time_running
    time_running += 1


@eel.expose
def get_ip():
    try:
        ip = socket.gethostbyname(socket.gethostname())
        logger.debug("Sending IP: " + ip)
        return ip
    except Exception as e:
        logger.exception(e)
        return "0.0.0.0"


def start_ui():
    global eel_running
    logger.debug("Starting UI...")
    try:
        eel.init('ui', allowed_extensions=['.js', '.html', '.css'])
    except Exception as e:
        logger.exception(e)
        return

    if debug:
        # options = {'mode': 'chrome-app', 'host': 'localhost', 'port': 8025}
        try:
            eel.start('main.html', size=(700, 810), mode='chrome-app', host='localhost', port=8025,
                      block=True, close_callback=eel_kill)
            eel_running = True
        except Exception as e:
            logger.exception(e)
            return
    else:
        """
        options = {
            'mode': 'custom',
            'host': 'localhost',
            'port': 8025,
            'cmdline_args': ['electron-win32-x64/electron.exe', '.']
        }
        """

        try:
            eel.start('main.html', size=(700, 810), mode='custom', host='localhost', port=8025,
                      cmdline_args=['electron-win32-x64/electron.exe', '.'], close_callback=eel_kill)
            eel_running = True
        except Exception as e:
            logger.exception(e)
            return


# ---------------------------------------------------------------------------------------------------------------------


# Updating ------------------------------------------------------------------------------------------------------------
def update_available():
    process = Popen(["jre/bin/java", "-jar", "updater.jar", "--check"], stdout=PIPE)
    res = process.communicate()[0].decode("utf-8").strip()
    available = (res == "true")

    process = Popen(["jre/bin/java", "-jar", "updater.jar", "--downloaded"], stdout=PIPE)
    res = process.communicate()[0].decode("utf-8").strip()

    return available and (res == "true")


def start_electron():
    Popen(["electron-win32-x64/electron.exe"], creationflags=DETACHED_PROCESS)


# ---------------------------------------------------------------------------------------------------------------------

def start_web_server():
    logger.debug("Starting web server...")
    webserver.start()


def delete_electron_cache():
    if not os.path.exists(os.getenv('APPDATA') + "\\Electron\\Cache"):
        logger.debug("Not deleting electron cache because the file does not exist")
        return
    logger.debug("Deleting electron cache...")
    try:
        shutil.rmtree(os.getenv('APPDATA') + "\\Electron\\Cache")
    except Exception as e:
        logger.exception(e)


def main():
    global logger
    pyautogui.FAILSAFE = False
    if logger is None:
        print("Logger is not defined!")
        logger = customlogger.create_logger("autobet", mode=customlogger.FILE)
    logger.debug("Started new session --------------------------------------------------------------------------------")
    delete_electron_cache()

    try:
        logger.log("Checking for updates...")
        update_avail = update_available()
    except Exception as e:
        logging.debug("Update check failed, skipping this step. Stack trace:")
        logging.error(e)
        update_avail = False

    try:
        if update_avail:
            logger.debug("Update available, just starting electron")
            start_electron()
        else:
            webserver.set_functions(start_function=wuy_start_script, stop_function=wuy_stop_script,
                                    get_all_money_function=get_all_winnings, get_money_function=get_current_winnings,
                                    get_races_won_function=get_races_won, get_races_lost_function=get_races_lost,
                                    get_time_function=get_time, get_running_function=get_running,
                                    get_gta_v_running_function=get_gta_running)

            threading.Thread(target=start_ui, args=()).start()
            start_web_server()
    except Exception as e:
        if eel_running:
            eel.exception()
        logger.exception(e)
    finally:
        kill()


if __name__ == "__main__":
    main()
