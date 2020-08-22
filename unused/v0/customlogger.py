import sys
import logging

FILE = 1
CONSOLE = 2
FILE_CONSOLE = 3


def create_logger(name, mode=CONSOLE, level=logging.DEBUG):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    formatter = logging.Formatter('[%(asctime)s] [%(filename)s %(funcName)s:%(lineno)d] [%(levelname)s] %(message)s')

    if mode == 2 or mode == 3:
        ch = logging.StreamHandler(sys.stdout)
        ch.setLevel(logging.DEBUG)

        ch.setFormatter(formatter)
        logger.addHandler(ch)

    if mode == 1 or mode == 3:
        fh = logging.FileHandler('output.log')
        fh.setLevel(level)

        fh.setFormatter(formatter)
        logger.addHandler(fh)

    if mode == CONSOLE:
        logger.info("Initializing logger in console mode")
    elif mode == FILE:
        logger.info("Initializing logger in file mode")
    elif mode == FILE_CONSOLE:
        logger.info("Initializing logger in file and console mode")
    else:
        raise Exception("Invalid logging mode specified")

    logger.info("Logger initialized.")

    return logger


def delete_old_log():
    open('output.log', 'w').close()