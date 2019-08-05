import pyautogui
from PIL import ImageGrab as ig
import cv2
import time
import win32api, win32con
import numpy as np
from pynput.keyboard import Key, KeyCode, Listener
import os
import threading
import win32gui
import ctypes
import eel

odds = [cv2.imread("img/2_1.jpg", 0), cv2.imread("img/3_1.jpg", 0), cv2.imread("img/4_1.jpg", 0), cv2.imread("img/5_1.jpg", 0)]
evens = cv2.imread("img/evens.jpg", 0)
cancel = cv2.imread("img/cancel.jpg", 0)
place_bet_main = cv2.imread("img/place_bet.jpg", 0)
place_bet = cv2.imread("img/place_bet_1.jpg", 0)
arrow_right = cv2.imread("img/arrow_right.jpg")
one = cv2.imread("img/one.jpg")
bet_again = cv2.imread("img/bet_again.jpg")

threshold = 0.98
running = False
waiting = 0
stopping = False
thread = 0


def getWindowTitle(wName):
    enumWindows = ctypes.windll.user32.EnumWindows
    enumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.POINTER(ctypes.c_int), ctypes.POINTER(ctypes.c_int))
    getWindowText = ctypes.windll.user32.GetWindowTextW
    getWindowTextLength = ctypes.windll.user32.GetWindowTextLengthW
    isWindowVisible = ctypes.windll.user32.IsWindowVisible

    titles = []

    def foreach_window(hwnd, lparam):
        if isWindowVisible(hwnd):
            length = getWindowTextLength(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            getWindowText(hwnd, buff, length + 1)
            titles.append(buff.value)
        return True

    enumWindows(enumWindowsProc(foreach_window), 0)

    for title in titles:
        if wName in title:
            return title


def callback(hwnd):
    rect = win32gui.GetWindowRect(hwnd)
    x = rect[0]
    y = rect[1]
    w = rect[2] - x
    h = rect[3] - y
    return x, y, w, h


def getWindowSize(windowName):
    return callback(win32gui.FindWindow(None, getWindowTitle(windowName)))


# Definition of width, height, x, y pos of window and multiplier of positions
xPos, yPos, width, height = getWindowSize("Opera")
multiplierW = width / 2560
multiplierH = height / 1440

# Set x and y pos to 0 if they are below 0. This happens when a window is maximised
if xPos < 0:
    xPos = 0

if yPos < 0:
    yPos = 0


def resize(image):
    return cv2.resize(image, None, fx=multiplierW, fy=multiplierH)


def click(x, y, move=True):
    if move:
        pyautogui.moveTo(x, y, duration=0.25)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, x, y, 0, 0)
    time.sleep(0.25)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, x, y, 0, 0)


def rightClick(x, y, move=True):
    if move:
        pyautogui.moveTo(x, y, duration=0.25)
    win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTDOWN, x, y, 0, 0)
    time.sleep(0.25)
    win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTUP, x, y, 0, 0)


def usable(img_gray):
    res = cv2.matchTemplate(img_gray, evens, cv2.TM_CCOEFF_NORMED)
    loc = np.where(res >= threshold)
    i = 0
    for pt in zip(*loc[::-1]):
        i = i + 1
    if i > 0:
        return False

    for img in odds:
        res = cv2.matchTemplate(img_gray, img, cv2.TM_CCOEFF_NORMED)
        loc = np.where(res >= threshold)
        i = 0
        for pt in zip(*loc[::-1]):
            i = i + 1
        if i > 1:
            return False
    return True


def refreshOdds():
    screen = ig.grab(bbox=(0, 0, 2560, 1440))
    img = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2BGR)
    img_g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    res = cv2.matchTemplate(img_g, cancel, eval("cv2.TM_CCOEFF_NORMED"))
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)

    click(max_loc[0], max_loc[1])
    rightClick(max_loc[0], max_loc[1], move=False)
    click(max_loc[0], max_loc[1], move=False)

    click(1905, 1187)


def placeBet():
    click(633, 448)

    pyautogui.moveTo(2027, 681, duration=0.25)
    for x in range(30):
        click(2027, 681, move=False)

    screen = ig.grab(bbox=(0, 0, 2560, 1440))
    img = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2BGR)
    img_g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    res = cv2.matchTemplate(img_g, place_bet, eval("cv2.TM_CCOEFF_NORMED"))
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)

    click(max_loc[0], max_loc[1])


def reset():
    screen = ig.grab(bbox=(0, 0, 2560, 1440))
    img = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2BGR)
    img_g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    res = cv2.matchTemplate(img_g, cv2.cvtColor(bet_again, cv2.COLOR_RGB2GRAY), eval("cv2.TM_CCOEFF_NORMED"))
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)

    click(max_loc[0], max_loc[1])

    click(1905, 1187)


def avoidKick():
    click(633, 448)

    screen = ig.grab(bbox=(0, 0, 2560, 1440))
    img = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2BGR)
    img_g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    res = cv2.matchTemplate(img_g, place_bet, eval("cv2.TM_CCOEFF_NORMED"))
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(res)

    click(max_loc[0], max_loc[1])


def maint():
    print("Started main thread")
    refreshes = 0
    global running
    while running:
        screen1 = ig.grab(bbox=(0, 0, 2560, 1440))
        img1 = cv2.cvtColor(np.array(screen1), cv2.COLOR_RGB2BGR)
        img_g1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        if usable(img_g1):
            refreshes = 0
            placeBet()
            time.sleep(34)
            reset()
        else:
            if refreshes > 3:
                refreshes = 0
                avoidKick()
                time.sleep(34)
                reset()
            else:
                refreshOdds()
                refreshes = refreshes + 1

    print("Stopped main thread")


def start_script():
    global thread
    global running
    global stopping
    if not running and not stopping:
        print("Starting script...")
        running = True
        thread = threading.Thread(target=maint, args=())
        thread.start()


def stop_script():
    global thread
    global running
    global stopping
    if running and not stopping:
        print("Waiting for main thread to finish...")
        running = False
        stopping = True
        thread.join()
        stopping = False


def start_stop():
    global running
    global stopping
    if not running and not stopping:
        start_script()
    else:
        stop_script()


def kill():
    print("Killed program.")
    os._exit(0)


combination_to_function = {
    frozenset([Key.shift, Key.ctrl_l, Key.f10]): start_stop,
    frozenset([Key.shift, Key.ctrl_l, Key.f9]): kill
}

current_keys = set()


def add_key_combos():
    def on_press(key):
        current_keys.add(key)
        if frozenset(current_keys) in combination_to_function:
            combination_to_function[frozenset(current_keys)]()

    def on_release(key):
        current_keys.remove(key)

    with Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()


eel.init('web', allowed_extensions=['.js', '.html', '.css'])


@eel.expose
def start_s_function():
    start_script()


@eel.expose
def stop_s_function():
    stop_script()


@eel.expose
def stopped():
    return not running and not stopping


def start_ui():
    print("starting ui")
    options = {
        'mode': 'custom',
        'args': ['electron-win32-x64/electron.exe', '.']
    }

    eel.start('main.html', size=(700, 670))


def main():
    start_ui()
    add_key_combos()


if __name__ == "__main__":
    main()
