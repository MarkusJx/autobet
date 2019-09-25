import socket
import sys

import numpy as np
from PIL import ImageGrab
import customlogger

import ai

"""
import numpy.random.common
import numpy.random.bounded_integers
import numpy.random.entropy
"""

winnings_ai = None

xPos = 0
yPos = 0
multiplierW = 0
multiplierH = 0
width = 0
height = 0

sock = None
logger = None


def main():
    global winnings_ai, sock, logger

    logger = customlogger.create_logger("winnings", mode=customlogger.FILE)

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_address = ('localhost', 8026)
    logger.debug("Creating socket")
    sock.connect(server_address)

    logger.debug("Socket creation finished")

    winnings_ai = ai.Winnings()

    logger.debug("AI initialized")
    logger.debug("Sending 'done' message")

    sock.sendall(bytes("done", "utf-8"))
    sock.setblocking(True)
    while True:
        res = handle_input(int.from_bytes(sock.recv(1), "big"))
        logger.debug("Sending result " + res)
        sock.sendall(int.to_bytes(res, 1, "big"))


def handle_input(line):
    logger.debug("Got input: " + line)
    if line == 1:
        return get_winnings()
    elif line == 2:
        global xPos, yPos, multiplierH, multiplierW, width, height
        length = int.from_bytes(sock.recv(1), "big")
        rec = sock.recv(length).decode("utf-8")
        xp, yp, w, h = rec.split(":")

        xPos = int(xp)
        yPos = int(yp)
        width = int(w)
        height = int(h)

        multiplierW = width / 2560
        multiplierH = height / 1440

        return 0
    elif line == 0:
        sys.exit(0)
    else:
        return line


def get_winnings():
    screen = ImageGrab.grab(bbox=(xPos, yPos, width, height))
    res = winnings_ai.predict_winnings(np.array(screen), multiplierW, multiplierH)
    logger.debug("Got result from AI: " + res)

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
    try:
        main()
    except Exception as e:
        logger.exception(e)
