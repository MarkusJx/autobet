import os
import socket
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

import ai
from utils import get_window_size, window_open

"""
import numpy.random.common
import numpy.random.bounded_integers
import numpy.random.entropy
"""

winnings = 0
winnings_all = 0
main_defined = False

running = False
stopping = False
eel_running = False
initializing = False
run_main = True

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

server = None
server_thread = None
races_won = 0
races_lost = 0

dummy = False

debug = True


def set_positions():
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
def click(x, y, move=True):
    if not stopping:
        x = round(x * multiplierW + xPos)
        y = round(y * multiplierH + yPos)

        if move:
            pyautogui.moveTo(x, y, duration=0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, x, y, 0, 0)
        eel.sleep(0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, x, y, 0, 0)


def right_click(x, y, move=True):
    if not stopping:
        x = round(x * multiplierW + xPos)
        y = round(y * multiplierH + yPos)

        if move:
            pyautogui.moveTo(x, y, duration=0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTDOWN, x, y, 0, 0)
        eel.sleep(0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTUP, x, y, 0, 0)


def refresh_odds():
    click(1670, 1312)

    right_click(1670, 1312, move=False)
    click(1670, 1312, move=False)

    click(1906, 1186)


def place_bet():
    click(634, 448)

    click(2028, 680)
    for x in range(32):
        click(2028, 680, move=False)

    click(1765, 1050)


def reset():
    click(1286, 1304)

    click(1905, 1187)


# ---------------------------------------------------------------------------------------------------------------------


# main ----------------------------------------------------------------------------------------------------------------
def main_f():
    global betting_ai, initializing, stopping
    print("Started main thread")
    betting_ai = ai.Betting()
    initializing = False
    while run_main:
        if window_open("Grand Theft Auto V"):
            set_positions()
            if winnings_ai_con is not None:
                set_winnings_positions()
        else:
            eel.sleep(0.5)
            continue  # TODO add error

        refreshes = 0
        while running:
            screen = ImageGrab.grab(bbox=(xPos, yPos, width, height))
            if betting_ai.usable(np.array(screen), multiplierW, multiplierH):
                refreshes = 0
                place_bet()
                update_winnings(-10000)
                eel.sleep(34)
                get_winnings_py()
                reset()
            else:
                if refreshes > 3:
                    refreshes = 0
                    avoid_kick()
                    eel.sleep(34)
                    reset()
                else:
                    refresh_odds()
                    refreshes = refreshes + 1
        stopping = False
        eel.sleep(0.5)
    print("Stopped main thread")


def start_script():
    global running
    if not running and not stopping:
        running = True


def stop_script():
    global running, stopping
    if running and not stopping:
        print("Waiting for main thread to finish...")
        running = False
        stopping = True


# ---------------------------------------------------------------------------------------------------------------------


# winnings ------------------------------------------------------------------------------------------------------------
def start_winnings_ai():
    global winnings_ai, winnings_ai_con
    if debug:
        winnings_ai = Popen(["python", "winnings.py"])  # used for testing
    else:
        winnings_ai = Popen(["winnings/winnings.exe"], stderr=PIPE, stdout=PIPE)
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_address = ('localhost', 8026)
    sock.bind(server_address)
    sock.listen(1)
    winnings_ai_con, client_address = sock.accept()
    winnings_ai_con.setblocking(True)
    if client_address[0] != "127.0.0.1":
        winnings_ai_con.close()
        winnings_ai_con = None
    sock.close()

    data = winnings_ai_con.recv(4).decode("utf-8")
    if data == "done":
        print("Winnings_ai initialized successfully")
    else:
        print("ERROR")


def set_winnings_positions():
    winnings_ai_con.sendall(int.to_bytes(2, 1, "big"))

    send = str(xPos) + ":" + str(yPos) + ":" + str(width) + ":" + str(height)
    winnings_ai_con.sendall(int.to_bytes(len(send), 1, "big"))
    winnings_ai_con.sendall(bytes(send, "utf-8"))

    if int.from_bytes(winnings_ai_con.recv(1), "big") == 0:
        print("Positions sent successfully.")


def get_winnings_py():
    winnings_ai_con.sendall(int.to_bytes(1, 1, "big"))
    res = winnings_ai_con.recv(1)
    res = int.from_bytes(res, "big")

    print("Results:")
    print(res)
    if res == 3:
        print("30k")
        update_winnings(30000)
        return
    elif res == 4:
        print("40k")
        update_winnings(40000)
        return
    elif res == 5:
        print("50k")
        update_winnings(50000)
        return
    elif res == 0:
        print("zero")
        eel.addMoney(0)
        server.add_money(0)
        return
    elif res == 1:
        print("running")
        eel.sleep(1)
        get_winnings_py()


def update_winnings(to_add):
    if to_add != 0:
        global winnings_all, winnings
        winnings += to_add
        winnings_all += to_add

        eel.setAllMoneyMade(winnings_all)
        server.set_all_money_made(winnings_all)

        if to_add > 0:
            global races_won
            races_won += 1
    else:
        global races_lost
        races_lost += 1

    eel.addMoney(to_add)
    server.add_money(to_add)

    f = open("winnings.txt", "w")
    f.write(str(winnings_all))
    f.close()


def get_races_won():
    return races_won


def get_races_lost():
    return races_lost


def get_all_winnings():
    return winnings_all


def get_current_winnings():
    return winnings


# ---------------------------------------------------------------------------------------------------------------------


# miscellaneous -------------------------------------------------------------------------------------------------------
def avoid_kick():
    click(633, 448)
    click(1720, 1036)


def eel_kill(page, sockets):
    if dummy:
        print(page)
        print(sockets)
    kill()


def kill():
    global run_main
    print("Killed program.")
    if winnings_ai_con is not None:
        winnings_ai_con.close()

    if winnings_ai is not None:
        winnings_ai.kill()

    run_main = False
    try:
        server.exit()
    except Exception as e:
        logging.error(e)

    try:
        eel.js_exit()
    finally:
        os._exit(0)


# ---------------------------------------------------------------------------------------------------------------------


# Key combos ----------------------------------------------------------------------------------------------------------
def start_stop():
    if not running and not stopping:
        eel.keycomb_start()
        start_script()
    else:
        eel.keycomb_stop()
        stop_script()


hk1 = SystemHotkey()
hk1.register(('control', 'shift', 'f10'), callback=lambda x: start_stop())

hk2 = SystemHotkey()
hk2.register(('control', 'shift', 'f9'), callback=lambda x: kill())


# ---------------------------------------------------------------------------------------------------------------------


# Eel init ------------------------------------------------------------------------------------------------------------
@eel.expose
def init_ai():
    global initializing, thread
    initializing = True
    thread = threading.Thread(target=main_f, args=())
    thread.start()
    while initializing:
        eel.sleep(1)
    start_winnings_ai()
    eel.doneLoading()
    server.initialized()


@eel.expose
def start_s_function():
    start_script()


@eel.expose
def stop_s_function():
    stop_script()


@eel.expose
def stopped():
    return not running and not stopping


@eel.expose
def get_winnings():
    global winnings_all
    try:
        f = open("winnings.txt", "r+")
        s = f.read()
        if s:
            winnings_all = int(s)
            f.close()
    except FileNotFoundError:
        f = open("winnings.txt", "w")
        f.write("0")
        f.close()
    eel.setAllMoneyMade(winnings_all)


@eel.expose
def get_ip():
    import socket
    return socket.gethostbyname(socket.gethostname())


def start_ui():
    global eel_running
    eel.init('ui', allowed_extensions=['.js', '.html', '.css'])

    if debug:
        options = {'mode': 'chrome-app', 'host': 'localhost', 'port': 8025}
        try:
            eel.start('main.html', size=(700, 810), options=options, callback=print, block=True)
        except Exception as e:
            logging.error(e)
    else:
        options = {
            'mode': 'custom',
            'host': 'localhost',
            'port': 8025,
            'args': ['electron-win32-x64/electron.exe', '.']
        }

        try:
            eel.start('main.html', size=(700, 810), options=options, callback=eel_kill)
        except Exception as e:
            logging.error(e)


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
    global server
    webserver.start()


def main():
    global server_thread
    pyautogui.FAILSAFE = False
    print(get_ip())
    try:
        if update_available():
            start_electron()
        else:
            webserver.set_functions(start_function=start_script, stop_function=stop_script,
                                    get_all_money_function=get_all_winnings, get_money_function=get_current_winnings,
                                    get_races_won_function=get_races_won, get_races_lost_function=get_races_lost)

            threading.Thread(target=start_ui(), args=()).start()
            # start_web_server()
    except Exception as e:
        logging.error(e)
    finally:
        kill()


if __name__ == "__main__":
    main()
