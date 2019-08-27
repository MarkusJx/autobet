import os
import socket
import threading
import time
from subprocess import Popen

import eel
import numpy as np
import pyautogui
import win32api
import win32con
from PIL import ImageGrab
from system_hotkey import SystemHotkey

"""
import numpy.random.common
import numpy.random.bounded_integers
import numpy.random.entropy
"""

import ai
from utils import get_window_size

running = False
waiting = 0
stopping = False
thread = 0
eel_running = False
winnings = 0
initializing = False
run_main = True

xPos = 0
yPos = 0
multiplierW = 0
multiplierH = 0
width = 0
height = 0

betting_ai = None
winnings_ai = None
winnings_ai_con = None


def set_positions():
    global xPos, yPos, multiplierH, multiplierW, width, height
    # Definition of width, height, x, y pos of window and multiplier of positions
    xPos, yPos, width, height = get_window_size("Grand Theft Auto V")  # TODO add error if not running
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
        time.sleep(0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, x, y, 0, 0)


def right_click(x, y, move=True):
    if not stopping:
        x = round(x * multiplierW + xPos)
        y = round(y * multiplierH + yPos)

        if move:
            pyautogui.moveTo(x, y, duration=0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTDOWN, x, y, 0, 0)
        time.sleep(0.25)
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
        set_positions()
        if winnings_ai_con is not None:
            set_winnings_positions()

        refreshes = 0
        while running:
            screen = ImageGrab.grab(bbox=(xPos, yPos, width, height))
            if betting_ai.usable(np.array(screen), multiplierW, multiplierH):
                refreshes = 0
                place_bet()
                eel.addMoney(-10000)
                update_winnings(-10000)
                time.sleep(34)
                get_winnings_py()
                reset()
            else:
                if refreshes > 3:
                    refreshes = 0
                    avoid_kick()
                    time.sleep(34)
                    reset()
                else:
                    refresh_odds()
                    refreshes = refreshes + 1
        stopping = False
        time.sleep(0.5)
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
    winnings_ai = Popen(["python", "winnings.py"])
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
        eel.addMoney(30000)
        update_winnings(30000)
        return
    elif res == 4:
        print("40k")
        eel.addMoney(40000)
        update_winnings(40000)
        return
    elif res == 5:
        print("50k")
        eel.addMoney(50000)
        update_winnings(50000)
        return
    elif res == 0:
        print("zero")
        eel.addMoney(0)
        return
    elif res == 1:
        print("running")
        time.sleep(1)
        get_winnings_py()


def update_winnings(to_add):
    global winnings
    winnings = winnings + to_add
    eel.setAllMoneyMade(winnings)
    f = open("winnings.txt", "w")
    f.write(str(winnings))
    f.close()
# ---------------------------------------------------------------------------------------------------------------------


# miscellaneous -------------------------------------------------------------------------------------------------------
def avoid_kick():
    click(633, 448)
    click(1720, 1036)


def kill():
    global run_main
    print("Killed program.")
    if winnings_ai_con is not None:
        winnings_ai_con.close()

    if winnings_ai is not None:
        winnings_ai.kill()

    run_main = False
    if eel_running:
        eel.js_exit()
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
# -------------------------------------------------------------------------------------------------------------


# Eel init ----------------------------------------------------------------------------------------------------
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
    global winnings
    try:
        f = open("winnings.txt", "r+")
        s = f.read()
        if s:
            winnings = int(s)
            f.close()
    except FileNotFoundError:
        f = open("winnings.txt", "w")
        f.write("0")
        f.close()
    eel.setAllMoneyMade(winnings)


def start_ui():
    global eel_running
    eel.init('web', allowed_extensions=['.js', '.html', '.css'])

    options = {
        'mode': 'custom',
        'host': 'localhost',
        'port': 8025,
        'args': ['electron-win32-x64/electron.exe', '.']
    }

    eel_running = True
    try:
        eel.start('main.html', size=(700, 670))
    except (SystemExit, MemoryError, KeyboardInterrupt):
        pass
    eel_running = False
# -------------------------------------------------------------------------------------------------------------


def main():
    pyautogui.FAILSAFE = False
    try:
        start_ui()
    finally:
        kill()


if __name__ == "__main__":
    main()
