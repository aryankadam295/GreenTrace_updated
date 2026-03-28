import os
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
import tempfile
import csv
import json
import re
from flask_cors import CORS
from waitress import serve

app = Flask(__name__)
CORS(app)

MODEL_PATH = "crop_disease_model_best.h5" if os.path.exists("crop_disease_model_best.h5") else "crop_disease_model.h5"
model = tf.keras.models.load_model(MODEL_PATH, compile=False)


def normalize_key(text):
    return re.sub(r"[^a-z0-9]+", "", (text or "").lower())


def prettify_class_name(class_name):
    name = class_name.replace("___", " : ").replace("__", " ").replace("_", " ")
    return " ".join(part.capitalize() for part in name.split())


def load_classes():
    if os.path.exists("class_indices.json"):
        with open("class_indices.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        # json keys are strings, convert to ordered class list by numeric index.
        return [data[str(i)] for i in range(len(data))]

    # Fallback so service still boots before first re-training.
    return [
        "Potato___Early_blight",
        "Potato___Healthy",
        "Tomato___Early_blight",
        "Tomato___Late_blight",
        "Tomato___Healthy",
    ]


classes = load_classes()

FALLBACK_SUPPLEMENTS_BY_CROP = {
    "apple": "Copper fungicide spray + balanced NPK fertilizer",
    "bell": "Copper-based bactericide + micronutrient fertilizer",
    "blueberry": "Acidic berry fertilizer + preventive fungicide spray",
    "cherry": "Sulfur/copper fungicide + fruit-tree fertilizer",
    "corn": "Mancozeb-based fungicide + NPK 20-20-20 fertilizer",
    "grape": "Systemic fungicide + potash-rich fertilizer",
    "peach": "Copper fungicide + orchard fertilizer",
    "pepper": "Copper bactericide + calcium-rich fertilizer",
    "potato": "Mancozeb/metalaxyl fungicide + potato-special fertilizer",
    "raspberry": "Berry fertilizer + preventive fungicide",
    "soyabean": "Bio-fungicide + balanced NPK fertilizer",
    "squash": "Powdery mildew fungicide + vegetable fertilizer",
    "strawberry": "Strawberry fertilizer + broad-spectrum fungicide",
    "tomato": "Tomato-special fertilizer + copper fungicide",
}


def extract_crop_name(text):
    raw = (text or "").lower().replace("___", " ").replace(":", " ").replace("_", " ")
    tokens = [t for t in raw.split() if t]
    return tokens[0] if tokens else "crop"


def load_details_from_csv():
    disease_rows = {}
    supplement_rows = {}

    with open("disease_info.csv", "r", encoding="cp1252", newline="") as disease_file:
        for row in csv.DictReader(disease_file):
            disease_rows[normalize_key(row.get("disease_name", ""))] = row

    with open("supplement_info.csv", "r", encoding="cp1252", newline="") as supplement_file:
        for row in csv.DictReader(supplement_file):
            supplement_rows[normalize_key(row.get("disease_name", ""))] = row

    details = {}
    for class_name in classes:
        class_key = normalize_key(class_name)
        pretty_name = prettify_class_name(class_name)
        pretty_key = normalize_key(pretty_name)

        disease_row = disease_rows.get(class_key) or disease_rows.get(pretty_key) or {}
        supplement_row = supplement_rows.get(class_key) or supplement_rows.get(pretty_key) or {}

        details[class_name] = {
            "display_name": disease_row.get("disease_name") or pretty_name,
            "description": disease_row.get("description", ""),
            "possible_steps": disease_row.get("Possible Steps", ""),
            "reference_image_url": disease_row.get("image_url", ""),
            "supplement_name": supplement_row.get("supplement name", ""),
            "supplement_image": supplement_row.get("supplement image", ""),
            "supplement_buy_link": supplement_row.get("buy link", ""),
        }

    return details


disease_details = load_details_from_csv()


def build_prediction_payload(class_name, confidence):
    details = disease_details.get(class_name, {})
    display_name = details.get("display_name", prettify_class_name(class_name))
    crop_key = extract_crop_name(display_name or class_name)
    fallback_product = FALLBACK_SUPPLEMENTS_BY_CROP.get(
        crop_key, "Recommended: balanced NPK fertilizer with crop-appropriate fungicide"
    )

    supplement_name = details.get("supplement_name", "").strip() or fallback_product

    return {
        "disease": class_name,
        "display_name": display_name,
        "confidence": float(confidence),
        "description": details.get("description", ""),
        "possible_steps": details.get("possible_steps", ""),
        "reference_image_url": details.get("reference_image_url", ""),
        "supplement_name": supplement_name,
        "supplement_image": details.get("supplement_image", ""),
        "supplement_buy_link": details.get("supplement_buy_link", ""),
    }


def preprocess_frame(frame):
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    img = cv2.resize(rgb, (224, 224), interpolation=cv2.INTER_AREA)
    return img.astype("float32") / 255.0


def predict_frame(frame):
    img = preprocess_frame(frame)

    # Small test-time augmentation helps when uploaded images differ from training set framing.
    tta_batch = np.stack([img, np.fliplr(img), np.flipud(img)], axis=0)
    pred = model.predict(tta_batch, verbose=0).mean(axis=0)

    idx = int(np.argmax(pred))
    confidence = float(pred[idx])
    top_indices = np.argsort(pred)[-3:][::-1]
    top_predictions = [
        {
            "class_name": classes[int(i)],
            "display_name": disease_details.get(classes[int(i)], {}).get(
                "display_name", prettify_class_name(classes[int(i)])
            ),
            "confidence": float(pred[int(i)]),
        }
        for i in top_indices
    ]
    return classes[idx], confidence, top_predictions


@app.route("/")
def home():
    return "Flask ML service running"


@app.route("/api/predict-crop", methods=["POST"])
def predict_crop():
    try:
        if "image" not in request.files:
            return jsonify({"message": "No image uploaded"}), 400

        file = request.files["image"]
        img = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({"message": "Invalid image"}), 400

        result_class, confidence, top_predictions = predict_frame(img)
        payload = build_prediction_payload(result_class, confidence)
        payload["top_predictions"] = top_predictions
        payload["model_path"] = MODEL_PATH
        payload["low_confidence"] = confidence < 0.45
        return jsonify(payload)
    except Exception as e:
        return jsonify({"message": f"Prediction failed: {str(e)}"}), 500


@app.route("/api/predict-video", methods=["POST"])
def predict_video():
    temp_path = None
    cap = None
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
        class_votes = []
        confidences = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % 15 == 0:
                cls, conf, _ = predict_frame(frame)
                class_votes.append(cls)
                confidences.append(conf)

            frame_count += 1

        if len(class_votes) == 0:
            return jsonify({"disease": "Unable to detect"})

        # Majority vote by class.
        final_class = max(set(class_votes), key=class_votes.count)
        class_conf = [c for cls, c in zip(class_votes, confidences) if cls == final_class]
        avg_conf = float(np.mean(class_conf)) if class_conf else float(np.mean(confidences))

        payload = build_prediction_payload(final_class, avg_conf)
        payload["model_path"] = MODEL_PATH
        payload["low_confidence"] = avg_conf < 0.45
        return jsonify(payload)

    except Exception as e:
        return jsonify({"message": f"Prediction failed: {str(e)}"}), 500
    finally:
        if cap is not None:
            cap.release()
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


if __name__ == "__main__":
    serve(
        app,
        host="0.0.0.0",
        port=5001,
        max_request_body_size=50 * 1024 * 1024,
    )
