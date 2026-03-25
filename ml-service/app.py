from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import cv2

app = Flask(__name__)

model = tf.keras.models.load_model("crop_disease_model.h5")

classes = [
"Potato___Early_blight",
"Potato___Healthy",
"Tomato___Early_blight",
"Tomato___Late_blight",
"Tomato___Healthy"
]

@app.route("/predict", methods=["POST"])
def predict():
    file = request.files["image"]
    
    img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)
    img = cv2.resize(img,(224,224))
    img = img/255.0
    img = np.expand_dims(img,axis=0)

    prediction = model.predict(img)
    result = classes[np.argmax(prediction)]

    return jsonify({"disease": result})

if __name__ == "__main__":
    app.run(port=5000)