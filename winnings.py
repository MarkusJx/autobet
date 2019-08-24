import socket
import sys

import numpy as np
from PIL import ImageGrab

import ai
from utils import get_window_size

# """
# """

winnings_ai = None

xPos = 0
yPos = 0
multiplierW = 0
multiplierH = 0
width = 0
height = 0


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


def main():
    global winnings_ai
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_address = ('localhost', 8026)
    sock.connect(server_address)
    winnings_ai = ai.Winnings()
    sock.sendall(bytes("done", "utf-8"))
    sock.setblocking(True)
    while True:
        res = handle_input(int.from_bytes(sock.recv(1), "big"))
        sock.sendall(int.to_bytes(res, 1, "big"))


def handle_input(line):
    print(line)
    # line = line.strip()
    if line == 1:
        set_positions()
        return get_winnings()
    elif line == 0:
        sys.exit(0)
    else:
        return line


def get_winnings():
    screen = ImageGrab.grab(bbox=(xPos, yPos, width, height))
    res = winnings_ai.predict_winnings(np.array(screen), multiplierW, multiplierH)

    if res == "running":
        return 1
    elif res == "zero":
        return 0
    elif res == "30k":
        return 3
    elif res == "40k":
        return 4
    elif res == "50k":
        return 5


if __name__ == "__main__":
    main()
