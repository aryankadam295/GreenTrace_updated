import tensorflow as tf
import numpy as np
import cv2
import json
import os

MODEL_PATH = "crop_disease_model_best.h5" if os.path.exists("crop_disease_model_best.h5") else "crop_disease_model.h5"
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

with open("class_indices.json", "r", encoding="utf-8") as f:
    class_indices = json.load(f)
classes = [class_indices[str(i)] for i in range(len(class_indices))]

# Load test image
img = cv2.imread("test.jpg")

# Resize image
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
img = cv2.resize(img, (224, 224), interpolation=cv2.INTER_AREA)

# Normalize
img = img/255.0

# Expand dimension for prediction
img = np.expand_dims(img,axis=0)

# Predict
prediction = model.predict(img, verbose=0)

result = classes[np.argmax(prediction)]

print("Detected Disease:", result)
