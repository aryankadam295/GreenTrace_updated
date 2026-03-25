import tensorflow as tf
import numpy as np
import cv2

# Load trained model
model = tf.keras.models.load_model("crop_disease_model.h5")

# Class labels (same order as training folders)
classes = [
"Potato___Early_blight",
"Potato___Healthy",
"Tomato___Early_blight",
"Tomato___Late_blight",
"Tomato___Healthy"
]

# Load test image
img = cv2.imread("test.jpg")

# Resize image
img = cv2.resize(img,(224,224))

# Normalize
img = img/255.0

# Expand dimension for prediction
img = np.expand_dims(img,axis=0)

# Predict
prediction = model.predict(img)

result = classes[np.argmax(prediction)]

print("Detected Disease:", result)