import os
import json
import tempfile
import csv

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import cv2
import numpy as np
import tensorflow as tf
from flask import Flask, jsonify, request
from flask_cors import CORS
from waitress import serve

print("Running ml-service app.py")

app = Flask(__name__)
CORS(app)

# ---------------- LOAD MODEL ----------------
MODEL_PATH = "crop_disease_model_best.h5" if os.path.exists("crop_disease_model_best.h5") else "crop_disease_model.h5"
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

if os.path.exists("class_indices.json"):
    with open("class_indices.json", "r", encoding="utf-8") as f:
        class_indices = json.load(f)
    classes = [class_indices[str(i)] for i in range(len(class_indices))]
else:
    output_classes = int(model.output_shape[-1])
    classes = [f"class_{i}" for i in range(output_classes)]

supplement_by_disease = {}
def normalize_disease_name(value):
    if not value:
        return ""
    normalized = value.strip().lower().replace(" ", "_")
    while "__" in normalized:
        normalized = normalized.replace("__", "_")
    return normalized

if os.path.exists("supplement_info.csv"):
    with open("supplement_info.csv", "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            disease_name = (row.get("disease_name") or "").strip()
            if not disease_name:
                continue
            supplement_by_disease[normalize_disease_name(disease_name)] = {
                "name": (row.get("supplement name") or "").strip(),
                "image": (row.get("supplement image") or "").strip(),
                "buy_link": (row.get("buy link") or "").strip(),
            }


def get_supplement(disease_name):
    if not disease_name:
        return None
    normalized = normalize_disease_name(disease_name)
    if normalized in supplement_by_disease:
        return supplement_by_disease[normalized]

    # Fallback for near matches (helps when labels differ by minor punctuation/spacing)
    for key, supplement in supplement_by_disease.items():
        if key in normalized or normalized in key:
            return supplement
    return None


# ---------------- HOME ROUTE ----------------
@app.route("/")
def home():
    return "Flask Server Running"


# ---------------- IMAGE API ----------------
@app.route("/api/predict-crop", methods=["POST"])
def predict_crop():
    try:
        print("Request received")

        if "image" not in request.files:
            print("No image found")
            return jsonify({"message": "No image uploaded"}), 400

        file = request.files["image"]
        print("File received:", file.filename)

        img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)

        if img is None:
            print("Invalid image")
            return jsonify({"message": "Invalid image"}), 400

        print("Image shape:", img.shape)

        if len(img.shape) == 2:
            img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
        elif img.shape[2] == 4:
            img = cv2.cvtColor(img, cv2.COLOR_BGRA2RGB)
        else:
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        img = cv2.resize(img, (224, 224))
        img = img / 255.0
        img = np.expand_dims(img, axis=0)

        print("Running prediction...")
        prediction = model.predict(img, verbose=0)

        print("Prediction done:", prediction)

        result_index = int(np.argmax(prediction))
        result = classes[result_index] if result_index < len(classes) else "Unknown"

        return jsonify({
            "disease": result,
            "supplement": get_supplement(result)
        })

    except Exception as e:
        print("FULL ERROR:", str(e))
        return jsonify({"message": "Prediction failed", "error": str(e)}), 500

# ---------------- VIDEO API ----------------
@app.route("/api/predict-video", methods=["POST"])
def predict_video():
    temp_path = None
    try:
        if "video" not in request.files:
            return jsonify({"message": "No video uploaded"}), 400

        file = request.files["video"]

        temp = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        file.save(temp.name)
        temp_path = temp.name
        temp.close()

        cap = cv2.VideoCapture(temp_path)

        if not cap.isOpened():
            return jsonify({"message": "Could not open video file"}), 400

        frame_count = 0
        predictions = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % 15 == 0:
                try:
                    if len(frame.shape) == 2:
                        img = cv2.cvtColor(frame, cv2.COLOR_GRAY2RGB)
                    elif frame.shape[2] == 4:
                        img = cv2.cvtColor(frame, cv2.COLOR_BGRA2RGB)
                    else:
                        img = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    img = cv2.resize(img, (224, 224), interpolation=cv2.INTER_AREA)
                    img = img / 255.0
                    img = np.expand_dims(img, axis=0)

                    pred = model.predict(img, verbose=0)
                    predictions.append(int(np.argmax(pred)))
                except Exception as inner_error:
                    print("Frame error:", inner_error)

            frame_count += 1

        cap.release()

        if len(predictions) == 0:
            return jsonify({"disease": "Unable to detect"})

        final_class = max(set(predictions), key=predictions.count)
        result = classes[final_class] if final_class < len(classes) else "Unknown"

        return jsonify({
            "disease": result,
            "supplement": get_supplement(result)
        })

    except Exception as e:
        print("Video Error:", str(e))
        return jsonify({"message": "Prediction failed", "error": str(e)}), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


# ---------------- RUN SERVER ----------------
if __name__ == "__main__":
    print("ML service starting on http://localhost:5001")
    serve(
        app,
        host="0.0.0.0",
        port=5001,
        max_request_body_size=50 * 1024 * 1024,
    )
