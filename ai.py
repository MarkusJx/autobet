from imageai.Prediction.Custom import CustomImagePrediction

"""
from imageai.Prediction.Custom import ModelTraining
import cv2
import numpy as np
import os

usableI = 197
unusable = 215
p30 = 43
p40 = 23
p50 = 18
lost = 129
running = 52

# Functions used for training ---------------------------------------------------------------------------------


def resize():
   path = "train_data_winnings/train/zero"
   for f in os.listdir(path):
        img = cv2.imread(os.path.join(path, f))
        height, width, channels = img.shape
        y1 = 1060
        y2 = 1146
        x1 = 1286
        x2 = 1590
        if height == 1080:
            multiplierW = 1920 / 2560
            multiplierH = 1080 / 1440
            y1 = round(y1 * multiplierH)
            y2 = round(y2 * multiplierH)
            x1 = round(x1 * multiplierW)
            x2 = round(x2 * multiplierW)
        crop_img = img[y1:y2, x1:x2]
        cv2.imwrite(os.path.join(path, f), crop_img)


def save_running(img):
    global running
    print("Saving screen: running")
    img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    cv2.imwrite("train_data_winnings/train/running/running-" + str(running) + ".jpg", img)
    running = running + 1


def save_screen(img, usable=False, winnings=-1):
    global usableI, unusable, p30, p40, p50, lost
    print("saving screen..." + str(usable) + ", " + str(winnings))
    img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
    if usable and winnings == -1:
        cv2.imwrite("train_data_betting/train/usable/usable-" + str(usableI) + ".jpg", img)
        usableI = usableI + 1
    else:
        if winnings != -1:
            if winnings == 0:
                cv2.imwrite("train_data_winnings/train/zero/zero-" + str(lost) + ".jpg", img)
                lost = lost + 1
            elif winnings == 30:
                cv2.imwrite("train_data_winnings/train/30k/30k-" + str(p30) + ".jpg", img)
                p30 = p30 + 1
            elif winnings == 40:
                cv2.imwrite("train_data_winnings/train/40k/40k-" + str(p40) + ".jpg", img)
                p40 = p40 + 1
            elif winnings == 50:
                cv2.imwrite("train_data_winnings/train/50k/50k-" + str(p50) + ".jpg", img)
                p50 = p50 + 1
        else:
            cv2.imwrite("train_data_betting/train/unusable/unusable-" + str(unusable) + ".jpg", img)
            unusable = unusable + 1


def train_winnings():
    model_trainer = ModelTraining()
    model_trainer.setModelTypeAsResNet()
    model_trainer.setDataDirectory("train_data_winnings")
    model_trainer.trainModel(num_objects=5, num_experiments=300, enhance_data=True, batch_size=32,
                             show_network_summary=True)

def train_betting():
    model_trainer = ModelTraining()
    model_trainer.setModelTypeAsResNet()
    model_trainer.setDataDirectory("train_data_betting")
    model_trainer.trainModel(num_objects=2, num_experiments=300, enhance_data=True, batch_size=32,
                             show_network_summary=True)

# -------------------------------------------------------------------------------------------------------------
"""

y1b = 448
y2b = 680
x1b = 220
x2b = 644

y1w = 1060
y2w = 1146
x1w = 1286
x2w = 1590


class Betting:
    def __init__(self):
        self.prediction = CustomImagePrediction()
        self.prediction.setModelTypeAsResNet()
        self.prediction.setModelPath("models/betting.h5")
        self.prediction.setJsonPath("models/betting.json")
        self.prediction.loadModel(num_objects=2)

    def predict_betting(self, img, multiplier_w, multiplier_h):
        y1 = round(y1b * multiplier_h)
        y2 = round(y2b * multiplier_h)
        x1 = round(x1b * multiplier_w)
        x2 = round(x2b * multiplier_w)
        crop_img = img[y1:y2, x1:x2]
        print(multiplier_h)
        print(multiplier_w)
        return self.prediction.predictImage(image_input=crop_img, result_count=1, input_type="array")

    def usable(self, img, multiplier_w, multiplier_h):
        predict, probability = self.predict_betting(img, multiplier_w, multiplier_h)
        print(predict)
        if predict[0] == "usable":
            return True
        else:
            return False


class Winnings:
    def __init__(self):
        self.prediction = CustomImagePrediction()
        self.prediction.setModelTypeAsResNet()
        self.prediction.setModelPath("models/winnings.h5")
        self.prediction.setJsonPath("models/winnings.json")
        self.prediction.loadModel(num_objects=5)

    def predict_winnings(self, img, multiplier_w, multiplier_h):
        y1 = round(y1w * multiplier_h)
        y2 = round(y2w * multiplier_h)
        x1 = round(x1w * multiplier_w)
        x2 = round(x2w * multiplier_w)
        crop_img = img[y1:y2, x1:x2]
        predict, prob = self.prediction.predictImage(image_input=crop_img, result_count=1, input_type="array")
        return predict[0]
