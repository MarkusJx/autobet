import pyautogui
from PIL import ImageGrab as ig
import cv2
import time
import win32api, win32con
import numpy as np
from pynput.keyboard import Key, Listener
import os
import threading
import win32gui
import ctypes
import eel

odds_orig = [cv2.imread("img/2_1.jpg", 0), cv2.imread("img/3_1.jpg", 0), cv2.imread("img/4_1.jpg", 0), cv2.imread("img/5_1.jpg", 0)]
evens_orig = cv2.imread("img/evens.jpg", 0)
p30k_orig = cv2.imread("img/30k.jpg")
p40k_orig = cv2.imread("img/40k.jpg")
p50k_orig = cv2.imread("img/50k.jpg")

odds = odds_orig
evens = evens_orig
p30k = p30k_orig
p40k = p40k_orig
p50k = p50k_orig

threshold = 0.98
running = False
waiting = 0
stopping = False
thread = 0
eel_running = False

xPos = 0
yPos = 0
multiplierW = 0
multiplierH = 0
width = 0
height = 0


def get_window_title(w_name):
    enum_windows = ctypes.windll.user32.EnumWindows
    enum_windows_process = ctypes.WINFUNCTYPE(ctypes.c_bool, ctypes.POINTER(ctypes.c_int), ctypes.POINTER(ctypes.c_int))
    get_window_text = ctypes.windll.user32.GetWindowTextW
    get_window_text_length = ctypes.windll.user32.GetWindowTextLengthW
    is_window_visible = ctypes.windll.user32.IsWindowVisible

    titles = []

    def foreach_window(hwnd, lparam):
        if is_window_visible(hwnd):
            length = get_window_text_length(hwnd)
            buff = ctypes.create_unicode_buffer(length + 1)
            get_window_text(hwnd, buff, length + 1)
            titles.append(buff.value)
        return True

    enum_windows(enum_windows_process(foreach_window), 0)

    for title in titles:
        if w_name in title:
            return title


def callback(hwnd):
    rect = win32gui.GetWindowRect(hwnd)
    x = rect[0]
    y = rect[1]
    w = rect[2] - x
    h = rect[3] - y
    return x, y, w, h


def get_window_size(window_name):
    return callback(win32gui.FindWindow(None, get_window_title(window_name)))


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


def resize(image):
    return cv2.resize(image, None, fx=multiplierW, fy=multiplierH)


def resize_images():
    global odds, odds_orig, evens, evens_orig, p30k, p30k_orig, p40k, p40k_orig, p50k, p50k_orig
    odds[0] = resize(odds_orig[0])
    odds[1] = resize(odds_orig[1])
    odds[2] = resize(odds_orig[2])
    odds[3] = resize(odds_orig[3])
    evens = resize(evens_orig)
    p30k = resize(p30k_orig)
    p40k = resize(p40k_orig)
    p50k = resize(p50k_orig)


def click(x, y, move=True):
    x = round(x * multiplierW + xPos)
    y = round(y * multiplierH + yPos)

    if move:
        pyautogui.moveTo(x, y, duration=0.25)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, x, y, 0, 0)
    time.sleep(0.25)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, x, y, 0, 0)


def right_click(x, y, move=True):
    x = round(x * multiplierW + xPos)
    y = round(y * multiplierH + yPos)

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


def refresh_odds():
    click(1670, 1312)

    right_click(1670, 1312, move=False)
    click(1670, 1312, move=False)

    click(1906, 1186)


def place_bet():
    click(634, 448)

    click(2028, 680)
    for x in range(29):
        click(2028, 680, move=False)

    click(1765, 1050)


def reset():
    click(1286, 1304)

    click(1905, 1187)


def avoid_kick():
    click(633, 448)

    click(1720, 1036)


def get_winnings():
    screen = ig.grab(bbox=(xPos, yPos, width, height))
    img_g = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2GRAY)

    res = cv2.matchTemplate(img_g, cv2.cvtColor(p30k, cv2.COLOR_RGB2GRAY), cv2.TM_CCOEFF_NORMED)
    loc = np.where(res >= 0.90)
    i = 0
    for pt in zip(*loc[::-1]):
        i = i + 1
    if i > 0:
        eel.addMoney(30000)
        return

    res = cv2.matchTemplate(img_g, cv2.cvtColor(p40k, cv2.COLOR_RGB2GRAY), cv2.TM_CCOEFF_NORMED)
    loc = np.where(res >= 0.90)
    i = 0
    for pt in zip(*loc[::-1]):
        i = i + 1
    if i > 0:
        eel.addMoney(40000)
        return

    res = cv2.matchTemplate(img_g, cv2.cvtColor(p50k, cv2.COLOR_RGB2GRAY), cv2.TM_CCOEFF_NORMED)
    loc = np.where(res >= 0.90)
    i = 0
    for pt in zip(*loc[::-1]):
        i = i + 1
    if i > 0:
        eel.addMoney(50000)
        return

    eel.addMoney(0)


def main_f():
    print("Started main thread")
    set_positions()
    resize_images()

    refreshes = 0
    global running
    while running:
        screen = ig.grab(bbox=(xPos, yPos, width, height))
        img_g = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2GRAY)
        if usable(img_g):
            refreshes = 0
            place_bet()
            eel.addMoney(-10000)
            time.sleep(34)
            get_winnings()
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

    print("Stopped main thread")


def start_script():
    global thread
    global running
    global stopping
    if not running and not stopping:
        print("Starting script...")
        running = True
        thread = threading.Thread(target=main_f, args=())
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
        eel.keycomb_start()
        start_script()
    else:
        eel.keycomb_stop()
        stop_script()


def kill():
    global eel_running
    print("Killed program.")
    if eel_running:
        eel.js_exit()
    os._exit(0)


# Key combos stolen from: https://nitratine.net/blog/post/how-to-make-hotkeys-in-python/ ----------------------
combination_to_function = {
    frozenset([Key.shift, Key.ctrl_l, Key.f10]): start_stop,
    frozenset([Key.shift, Key.ctrl_l, Key.f9]): kill
}

current_keys = set()


def on_press(key):
    current_keys.add(key)
    if frozenset(current_keys) in combination_to_function:
        combination_to_function[frozenset(current_keys)]()


def on_release(key):
    current_keys.remove(key)


def add_listener():
    with Listener(on_press=on_press, on_release=on_release) as listener:
        listener.join()

# -------------------------------------------------------------------------------------------------------------
# Eel init ----------------------------------------------------------------------------------------------------


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
    global eel_running
    options = {
        'mode': 'custom',
        'args': ['electron-win32-x64/electron.exe', '.']
    }

    eel_running = True
    try:
        eel.start('main.html', size=(700, 670), options=options)
    except (SystemExit, MemoryError, KeyboardInterrupt):
        pass
    eel_running = False
    kill()
# -------------------------------------------------------------------------------------------------------------


def main():
    time.sleep(10)
    # Get and print the mouse coordinates.
    #x, y = pyautogui.position()
    #positionStr = 'X: ' + str(x).rjust(4) + ' Y: ' + str(y).rjust(4)
    #print(positionStr)
    t = threading.Thread(target=add_listener, args=())
    t.start()
    start_ui()


if __name__ == "__main__":
    main()
