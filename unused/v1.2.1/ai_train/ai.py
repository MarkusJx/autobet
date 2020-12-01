import os

import tensorflow as tf

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
tf.compat.v1.logging.set_verbosity(tf.compat.v1.logging.ERROR)
os.environ['KMP_WARNINGS'] = "0"

from imageai.Prediction.Custom import CustomImagePrediction

        from imageai.Prediction.Custom import ModelTraining
        import cv2
        import numpy as np
        import os
        import random

# Functions used for training ---------------------------------------------------------------------------------

# img size: 110 x 46

        def resize():
        random.seed()
path = "train_ai\\test"
for d in os.listdir(path):
resize_in(os.path.join(path, d))


def resize_in(path):
n = 30
for f in os.listdir(path):
img = cv2.imread(os.path.join(path, f))
for i in range(0, 1000):
#height, width, channels = img.shape
rand = random.uniform(0.2, 1.0)
width = int(img.shape[1] * rand)
height = int(img.shape[0] * rand)
dim = (width, height)
resized = cv2.resize(img, dim, interpolation = cv2.INTER_AREA)
cv2.imwrite(os.path.join(path, str(n) + ".jpg"), resized)
n += 1

#resize()
#resize_in("train_ai\\test\\10")

"""
def train_winnings():
model_trainer = ModelTraining()
model_trainer.setModelTypeAsInceptionV3()
model_trainer.setDataDirectory("train_winnings")
model_trainer.trainModel(num_objects=5, num_experiments=2, enhance_data=True, batch_size=32,
        show_network_summary=True, save_full_model=True)

#train_winnings()

def train_betting():
model_trainer = ModelTraining()
model_trainer.setModelTypeAsInceptionV3()
model_trainer.setDataDirectory("train_data_betting")
model_trainer.trainModel(num_objects=2, num_experiments=300, enhance_data=True, batch_size=32,
        show_network_summary=True)
"""

def train_ai():
model_trainer = ModelTraining()
model_trainer.setModelTypeAsInceptionV3()
model_trainer.setDataDirectory("train_ai")
model_trainer.trainModel(num_objects=15, num_experiments=300, enhance_data=True, batch_size=16,
        show_network_summary=True, save_full_model=True)

train_ai()