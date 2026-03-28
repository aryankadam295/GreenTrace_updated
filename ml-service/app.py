import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
import tempfile
import os
from flask_cors import CORS
from waitress import serve

print("🔥 RUNNING CORRECT app.py FILE")

app = Flask(__name__)
CORS(app)

# ---------------- LOAD MODEL ----------------
model = tf.keras.models.load_model("crop_disease_model.h5")

classes = [
    "Potato___Early_blight",
    "Potato___Healthy",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Healthy"
]

# ---------------- HOME ROUTE ----------------
@app.route("/")
def home():
    return "✅ Flask Server Running"

# ---------------- IMAGE API ----------------
@app.route("/api/predict-crop", methods=["POST"])
def predict_crop():
    try:
        print("✅ Image API Hit")

        if "image" not in request.files:
            return jsonify({"message": "No image uploaded"}), 400

        file = request.files["image"]

        img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"message": "Invalid image"}), 400

        img = cv2.resize(img, (224, 224))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)

        prediction = model.predict(img)
        result = classes[np.argmax(prediction)]

        return jsonify({"disease": result})

    except Exception as e:
        print("❌ Image Error:", str(e))
        return jsonify({"message": "Prediction failed"}), 500


# ---------------- VIDEO API ----------------
@app.route("/api/predict-video", methods=["POST"])
def predict_video():
    try:
        print("✅ Video API Hit")

        if "video" not in request.files:
            return jsonify({"message": "No video uploaded"}), 400

        file = request.files["video"]

        # ✅ FIX: suffix='.mp4' so cv2.VideoCapture can read the file correctly
        temp = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        file.save(temp.name)
        temp.close()  # ✅ Close before OpenCV opens it (important on Windows)

        cap = cv2.VideoCapture(temp.name)

        if not cap.isOpened():
            os.unlink(temp.name)
            return jsonify({"message": "Could not open video file"}), 400

        frame_count = 0
        predictions = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % 15 == 0:
                try:
                    img = cv2.resize(frame, (224, 224))
                    img = img / 255.0
                    img = np.expand_dims(img, axis=0)

                    pred = model.predict(img)
                    predictions.append(np.argmax(pred))
                except Exception as inner_error:
                    print("Frame error:", inner_error)

            frame_count += 1

        cap.release()
        os.unlink(temp.name)  # ✅ Clean up temp file

        if len(predictions) == 0:
            return jsonify({"disease": "Unable to detect"})

        final_class = max(set(predictions), key=predictions.count)
        result = classes[final_class]

        print(f"✅ Video prediction: {result} from {len(predictions)} frames")
        return jsonify({"disease": result})

    except Exception as e:
        print("❌ Video Error:", str(e))
        return jsonify({"message": "Prediction failed"}), 500


# ---------------- PRINT ROUTES ----------------
print("📌 AVAILABLE ROUTES:")
print(app.url_map)

# ---------------- RUN SERVER ----------------
if __name__ == "__main__":
    print("🚀 ML service starting on http://localhost:5001")
    # ✅ waitress is a proper Windows WSGI server — no reloader bugs, no 404 quirks
    # max_request_body_size handles large video uploads (default is only 1MB)
    serve(
        app,
        host="0.0.0.0",
        port=5001,
        max_request_body_size=50 * 1024 * 1024  # ✅ 50MB limit for video files
    )
