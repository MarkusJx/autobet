import sys

import numpy as np
import cv2
import os

samples = np.empty((0,100))
responses = []

def train_file(path):
    global samples, responses
    print("path: " + path)
    expect = path.split("/")[1].split(".")[0]
    if (len(expect) == 1 or len(expect) == 2) and expect != "0":
        expect += "/1"
    elif expect != "evens" and expect != "0":
        expect = "+" + expect

    #print("Expecting: " + expect)
    im = cv2.imread(path)

    #im3 = im.copy()

    for s in np.arange(0.45, 1.0, 0.01):
        #print("Scale: " + str(s))
        width = int(im.shape[1] * s)
        height = int(im.shape[0] * s)
        dim = (width, height)

        width1 = im.shape[1]
        height1 = im.shape[0]
        dim1 = (width1, height1)
        #print("Dim: " + str(dim) + ", dim1: " + str(dim1))

        resized = cv2.resize(im, dim)
        resized1 = cv2.resize(resized, dim1)
        imc = resized1.copy()
        imcopy = resized1.copy()

        image = cv2.GaussianBlur(resized1, (3, 3), 0)
        resized1 = cv2.addWeighted(resized1, 1.5, image, -0.5, 16)

        gray = cv2.cvtColor(resized1, cv2.COLOR_BGR2GRAY)
        blur = cv2.GaussianBlur(gray, (3, 3), 2)
        thresh = cv2.adaptiveThreshold(blur, 255, 1, 1, 11, 2)

        #sx = cv2.Sobel(thresh, cv2.CV_32F, 1, 0)
        #sy = cv2.Sobel(thresh, cv2.CV_32F, 0, 1)
        #m = cv2.magnitude(sx, sy)
        #thresh = cv2.normalize(m, None, 0., 255., cv2.NORM_MINMAX, cv2.CV_8U)

        #cv2.imshow("thresh", thresh)
        #cv2.waitKey(0)

    #################      Now finding Contours         ###################

        contours,hierarchy = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)[-2:]
        contours = sorted(contours, key=lambda ctr: cv2.boundingRect(ctr)[0])

    #keys = [i for i in range(48,58)]
        visited = []
        for i in range(0, width1):
            visited.append(False)

        def set_visited(visited, x1, x2):
            v = 0
            for i in range(x1, x2):
                if visited[i]:
                    v += 1
                    if v > 10:
                        return True

            for i in range(x1, x2):
                visited[i] = True

            return False

        i = 0
        for cnt in contours:
            if cv2.contourArea(cnt) > 50:
                [x, y, w, h] = cv2.boundingRect(cnt)

                if  h > 28 and w < 28 and w > 9:
                    if set_visited(visited, x, x + w):
                        continue

                    cv2.rectangle(imc, (x, y), (x + w, y + h), (0, 0, 255), 2)
                    roi = thresh[y: y + h, x: x + w]
                    roismall = cv2.resize(roi, (10, 10))
                    cv2.imshow('norm', imc)
                    key = cv2.waitKey(1)

                    #if key == 27:  # (escape to quit)
                    #    sys.exit()
                #else:#if key in keys:
                #    responses.append(int(key))
                    #responses.append(int(chr(key)))
                    if i >= len(expect):
                        cv2.waitKey(0)
                        sys.exit(0)
                    e = expect[i]
                    #print("Adding: " + e)
                    responses.append(ord(e))
                    i += 1
                    sample = roismall.reshape((1,100))
                    samples = np.append(samples,sample,0)

        if i != len(expect):
            print("i is not equal to the expected length: " + str(i) + " vs. " + str(len(expect)))
            print(str(hierarchy))
            for cnt in contours:
                if cv2.contourArea(cnt) > 50:
                    [x, y, w, h] = cv2.boundingRect(cnt)
                    if h> 28 and w < 30 and w > 8:
                        cv2.rectangle(imcopy, (x, y), (x + w, y + h), (0, 0, 255), 2)
            cv2.imshow('error', imcopy)
            cv2.waitKey(0)
            sys.exit(1)

for f in os.listdir('img'):
    if f.endswith(".jpg"):
        train_file('img/' + f)

responses = np.array(responses,np.float32)
responses = responses.reshape((responses.size,1))
print("training complete")

#np.savetxt('generalsamples.data',samples)
#np.savetxt('generalresponses.data',responses)

responses = responses.reshape((responses.size,1))
samples = np.array(samples, np.float32)

model = cv2.ml.KNearest_create()
model.train(samples, cv2.ml.ROW_SAMPLE, responses)
model.save("model.yml")
