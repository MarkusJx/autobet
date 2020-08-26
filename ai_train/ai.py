import os

import tensorflow as tf

#import customlogger

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
os.environ['KMP_WARNINGS'] = "0"

from imageai.Prediction.Custom import CustomImagePrediction

        from imageai.Prediction.Custom import ModelTraining
        import cv2
        import numpy as np
        import os
        import random

        usableI = 197
unusable = 215
p30 = 43
p40 = 23
p50 = 18
lost = 129
running = 52


# Functions used for training ---------------------------------------------------------------------------------

# img size: 110 x 46

xLoc = 240
Loc = 464, 628, 790, 952, 1114, 1276

def resize():
    random.seed()
    path = "1"
    n = 2
    for f in os.listdir(path):
        img = cv2.imread(os.path.join(path, f))
        #height, width, channels = img.shape
        for i in range(0, 5000):
            rand = random.uniform(0.2, 1.0)
            width = int(img.shape[1] * rand)
            height = int(img.shape[0] * rand)
            dim = (width, height)
            resized = cv2.resize(img, dim, interpolation = cv2.INTER_AREA)
            cv2.imwrite(os.path.join("1", str(n) + ".jpg"), resized)
            n += 1

def train_winnings():
    model_trainer = ModelTraining()
    model_trainer.setModelTypeAsInceptionV3()
    model_trainer.setDataDirectory("train_winnings")
    model_trainer.trainModel(num_objects=5, num_experiments=2, enhance_data=True, batch_size=32,
        show_network_summary=True, save_full_model=True)

train_winnings()

def train_betting():
    model_trainer = ModelTraining()
    model_trainer.setModelTypeAsInceptionV3()
    model_trainer.setDataDirectory("train_data_betting")
    model_trainer.trainModel(num_objects=2, num_experiments=300, enhance_data=True, batch_size=32,
        show_network_summary=True)
