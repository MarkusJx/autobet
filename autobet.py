import ctypes
import os
import threading
import time

# import cv2
import eel
import numpy as np
import pyautogui
import win32api
import win32con
import win32gui
from PIL import ImageGrab as ig
from pynput.keyboard import Key, Listener

import ai

# import numpy.random.common
# import numpy.random.bounded_integers
# import numpy.random.entropy

# odds_orig = [cv2.imread("img/2_1.jpg", 0), cv2.imread("img/3_1.jpg", 0), cv2.imread("img/4_1.jpg", 0), cv2.imread("img/5_1.jpg", 0)]
# evens_orig = cv2.imread("img/evens.jpg", 0)
# p30k_orig = cv2.imread("img/30k.jpg", 0)
# p40k_orig = cv2.imread("img/40k.jpg", 0)
# p50k_orig = cv2.imread("img/50k.jpg", 0)

# odds = odds_orig
# evens = evens_orig
# p30k = p30k_orig
# p40k = p40k_orig
# p50k = p50k_orig

# threshold = 0.98
running = False
waiting = 0
stopping = False
thread = 0
eel_running = False
winnings = 0
error = False

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


# def resize_images():
#    global odds, evens, p30k, p40k, p50k
#    if width == 1920 and height == 1080:
#        print("1080")
#        odds = [cv2.imread("img/2_1_1080.jpg", 0), cv2.imread("img/3_1_1080.jpg", 0), cv2.imread("img/4_1_1080.jpg", 0),
#                cv2.imread("img/5_1_1080.jpg", 0)]
#        evens = cv2.imread("img/evens_1080.jpg", 0)
#        p30k = cv2.imread("img/30k_1080.jpg", 0)
#        p40k = cv2.imread("img/40k_1080.jpg", 0)
#        p50k = cv2.imread("img/50k_1080.jpg", 0)
#    else:
#        print("1440")
#        odds = odds_orig
#        evens = evens_orig
#        p30k = p30k_orig
#        p40k = p40k_orig
#        p50k = p50k_orig


def click(x, y, move=True):
    if not error:  # failsafe
        x = round(x * multiplierW + xPos)
        y = round(y * multiplierH + yPos)

        if move:
            pyautogui.moveTo(x, y, duration=0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, x, y, 0, 0)
        time.sleep(0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, x, y, 0, 0)


def right_click(x, y, move=True):
    if not error:  # failsafe
        x = round(x * multiplierW + xPos)
        y = round(y * multiplierH + yPos)

        if move:
            pyautogui.moveTo(x, y, duration=0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTDOWN, x, y, 0, 0)
        time.sleep(0.25)
        win32api.mouse_event(win32con.MOUSEEVENTF_RIGHTUP, x, y, 0, 0)


# def usable(img_gray):
#    res = cv2.matchTemplate(img_gray, evens, cv2.TM_CCOEFF_NORMED)
#    loc = np.where(res >= threshold)
#    i = 0
#    for pt in zip(*loc[::-1]):
#        i = i + 1
#    if i > 0:
#        return False
#
#    for img in odds:
#        res = cv2.matchTemplate(img_gray, img, cv2.TM_CCOEFF_NORMED)
#        loc = np.where(res >= threshold)
#        i = 0
#        for pt in zip(*loc[::-1]):
#            i = i + 1
#        if i > 1:
#            return False
#    return True


def refresh_odds():
    click(1670, 1312)

    right_click(1670, 1312, move=False)
    click(1670, 1312, move=False)

    click(1906, 1186)


def place_bet():
    click(634, 448)

    click(2028, 680)
    for x in range(30):
        click(2028, 680, move=False)

    click(1765, 1050)


def reset():
    click(1286, 1304)

    click(1905, 1187)


def avoid_kick():
    click(633, 448)
    click(1720, 1036)


def update_winnings(to_add):
    global winnings
    winnings = winnings + to_add
    eel.setAllMoneyMade(winnings)
    f = open("winnings.txt", "w")
    f.write(str(winnings))
    f.close()


def get_winnings_py():
    #global p30k, p40k, p50k
    screen = ig.grab(bbox=(xPos, yPos, width, height))
    res = ai.predict_winnings(np.array(screen), multiplierW, multiplierH)

    print("Results:")
    print(res)
    if res == "30k":
        print("30k")
        eel.addMoney(30000)
        update_winnings(30000)
        return
    elif res == "40k":
        print("40k")
        eel.addMoney(40000)
        update_winnings(40000)
        return
    elif res == "50k":
        print("50k")
        eel.addMoney(50000)
        update_winnings(50000)
        return
    elif res == "zero":
        print("zero")
        eel.addMoney(0)
        return
    elif res == "running":
        print("running")
        time.sleep(1)
        get_winnings_py()

    # img_g = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2GRAY)

    # res = cv2.matchTemplate(img_g, p30k, cv2.TM_CCOEFF_NORMED)
    # loc = np.where(res >= 0.98)
    # i = 0
    # for pt in zip(*loc[::-1]):
    #    i = i + 1
    # if i > 0:
    #    print("30k")
    #    eel.addMoney(30000)
    #    update_winnings(30000)
    #    return

    # res = cv2.matchTemplate(img_g, p40k, cv2.TM_CCOEFF_NORMED)
    # loc = np.where(res >= 0.98)
    # i = 0
    # for pt in zip(*loc[::-1]):
    #    i = i + 1
    # if i > 0:
    #    print("40k")
    #    eel.addMoney(40000)
    #    update_winnings(40000)
    #    return

    # res = cv2.matchTemplate(img_g, p50k, cv2.TM_CCOEFF_NORMED)
    # loc = np.where(res >= 0.98)
    # i = 0
    # for pt in zip(*loc[::-1]):
    #    i = i + 1
    # if i > 0:
    #    print("50k")
    #    eel.addMoney(50000)
    #    update_winnings(50000)
    #    return


#screens = 0
# errors = 0


def main_f():
    #global errors, screens
    print("Started main thread")
    set_positions()
    # resize_images()

    ai.init_betting_prediction()
    ai.init_winnings_prediction()

    refreshes = 0
    global running
    while running:
        screen = ig.grab(bbox=(xPos, yPos, width, height))
        # img_g = cv2.cvtColor(np.array(screen), cv2.COLOR_RGB2GRAY)
        # _usable = usable(img_g)
        # if _usable == ai.usable(np.array(screen), multiplierW, multiplierW):
        #    print("Errors: " + str(errors) + ", Screens: " + str(screens))
        # else:
        #    print("ERROR")
        #    errors = errors + 1
        #    print("Errors: " + str(errors) + ", Screens: " + str(screens))
        # screens = screens + 1
        if ai.usable(np.array(screen), multiplierW, multiplierH):
            refreshes = 0
            place_bet()
            eel.addMoney(-10000)
            update_winnings(-10000)
            time.sleep(34)
            #get_winnings_py() does not work
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
    pyautogui.FAILSAFE = False
    try:
        t = threading.Thread(target=add_listener, args=())
        t.start()
        start_ui()
    except:
        kill()


if __name__ == "__main__":
    main()
