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

# Local validator utilities
from validator import validate_image_quality, is_plant_image

print("Running ml-service app.py")

app = Flask(__name__)
CORS(app)

# ---------------- LOAD MODEL ----------------
MODEL_PATH = "crop_disease_model_best.h5" if os.path.exists("crop_disease_model_best.h5") else "crop_disease_model.h5"
model = tf.keras.models.load_model(MODEL_PATH, compile=False)

# Determine classes
if os.path.exists("class_indices.json"):
    with open("class_indices.json", "r", encoding="utf-8") as f:
        class_indices = json.load(f)
    classes = [class_indices[str(i)] for i in range(len(class_indices))]
else:
    output_classes = int(model.output_shape[-1])
    classes = [f"class_{i}" for i in range(output_classes)]

# Optional disease detail data
disease_details = {}
if os.path.exists("plant_disease_details.json"):
    try:
        with open("plant_disease_details.json", "r", encoding="utf-8") as f:
            disease_details = json.load(f)
    except Exception as e:
        print("Warning: failed to load plant_disease_details.json:", e)

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

    if disease_details:
        for key, info in disease_details.items():
            if normalize_disease_name(key) == normalized or normalize_disease_name(info.get("display_name", "")) == normalized:
                return {
                    "name": info.get("supplement_name", ""),
                    "image": info.get("supplement_image"),
                    "buy_link": info.get("supplement_buy_link"),
                }

    for key, supplement in supplement_by_disease.items():
        if key in normalized or normalized in key:
            return supplement
    return None


def get_fertilizers(disease_name):
    if not disease_name:
        return []
    normalized = normalize_disease_name(disease_name)

    if disease_details:
        for key, info in disease_details.items():
            if normalize_disease_name(key) == normalized:
                fert = []
                supplement_name = info.get("supplement_name")
                if supplement_name:
                    fert.append({
                        "name": supplement_name,
                        "notes": info.get("possible_steps") or "Follow label instructions",
                    })
                return fert

    if normalized in supplement_by_disease:
        s = supplement_by_disease[normalized]
        return [{
            "name": s.get("name"),
            "buy_link": s.get("buy_link"),
        }]

    return []


# ---------------- Utilities: preprocessing ----------------
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD  = np.array([0.229, 0.224, 0.225], dtype=np.float32)
TARGET_SIZE   = (224, 224)
CONFIDENCE_THRESHOLD = 0.70


def preprocess_image(img_bgr, use_imagenet_norm=True):
    if img_bgr.ndim == 2:
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_GRAY2RGB)
    elif img_bgr.shape[2] == 4:
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGRA2RGB)
    else:
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

    img_resized = cv2.resize(img_rgb, TARGET_SIZE, interpolation=cv2.INTER_AREA)
    img_float   = img_resized.astype(np.float32) / 255.0

    if use_imagenet_norm:
        img_float = (img_float - IMAGENET_MEAN) / IMAGENET_STD

    return np.expand_dims(img_float, axis=0)


# ---------------- HOME ROUTE ----------------
@app.route("/")
def home():
    return "Flask Server Running"


# ---------------- IMAGE API ----------------
@app.route("/api/predict-crop", methods=["POST"])
def predict_crop():
    try:
        print("[predict-crop] Request received")

        if "image" not in request.files:
            return jsonify({"message": "No image uploaded"}), 400

        file = request.files["image"]
        img_bgr = cv2.imdecode(np.frombuffer(file.read(), np.uint8), cv2.IMREAD_COLOR)

        # ── Stage 1: Image Quality Check ──────────────────────
        valid, msg = validate_image_quality(img_bgr)
        if not valid:
            return jsonify({"message": "Invalid image", "reason": msg}), 400

        # ── Stage 2: Plant Detection ───────────────────────────
        plant_ok, plant_msg = is_plant_image(img_bgr)
        if not plant_ok:
            return jsonify({
                "message": "Image does not appear to contain a plant",
                "reason": plant_msg,
                "error_type": "not_a_plant"
            }), 422

        # ── Stage 3: Preprocess ────────────────────────────────
        img_input = preprocess_image(img_bgr, use_imagenet_norm=True)

        # ── Stage 4: Predict ───────────────────────────────────
        preds        = model.predict(img_input, verbose=0)
        probs        = preds[0]
        result_index = int(np.argmax(probs))
        confidence   = float(probs[result_index])
        result       = classes[result_index] if result_index < len(classes) else "Unknown"

        # ── Stage 5: Top 3 Predictions ─────────────────────────
        top3_indices     = np.argsort(probs)[::-1][:3]
        top3_predictions = [
            {
                "disease":    classes[i] if i < len(classes) else "Unknown",
                "confidence": f"{float(probs[i]):.1%}"
            }
            for i in top3_indices
        ]

        # ── Stage 6: Confidence Threshold Check ────────────────
        if confidence < CONFIDENCE_THRESHOLD:
            return jsonify({
                "disease":          "Uncertain",
                "confidence":       f"{confidence:.1%}",
                "message":          "Model confidence is too low. Please upload a clearer and closer image of the affected leaf.",
                "top3_predictions": top3_predictions,
                "supplement":       None,
                "fertilizers":      []
            }), 200

        # ── Stage 7: Return Confident Result ───────────────────
        return jsonify({
            "disease":          result,
            "confidence":       f"{confidence:.1%}",
            "top3_predictions": top3_predictions,
            "supplement":       get_supplement(result),
            "fertilizers":      get_fertilizers(result),
        })

    except Exception as e:
        print("[predict-crop] ERROR:", str(e))
        return jsonify({"message": "Prediction failed", "error": str(e)}), 500


# ---------------- VIDEO API ----------------
@app.route("/api/predict-video", methods=["POST"])
def predict_video():
    temp_path = None
    try:
        if "video" not in request.files:
            return jsonify({"message": "No video uploaded"}), 400

        file = request.files["video"]

        temp      = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_path = temp.name
        file.save(temp.name)
        temp.close()

        cap = cv2.VideoCapture(temp_path)
        if not cap.isOpened():
            return jsonify({"message": "Could not open video file"}), 400

        frame_count = 0
        predictions = []
        confidences = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % 15 == 0:

                # Quality check on first sampled frame only
                if frame_count == 0:
                    valid, msg = validate_image_quality(frame)
                    if not valid:
                        cap.release()
                        return jsonify({"message": "Invalid video/frame", "reason": msg}), 400

                # Skip non-plant frames
                plant_ok, _ = is_plant_image(frame)
                if not plant_ok:
                    frame_count += 1
                    continue

                try:
                    img_input = preprocess_image(frame, use_imagenet_norm=True)
                    pred      = model.predict(img_input, verbose=0)[0]
                    idx       = int(np.argmax(pred))
                    predictions.append(idx)
                    confidences.append(float(np.max(pred)))
                except Exception as inner_error:
                    print("[predict-video] Frame error:", inner_error)

            frame_count += 1

        cap.release()

        if len(predictions) == 0:
            return jsonify({
                "disease":  "Unable to detect",
                "message":  "No valid plant frames found in video."
            })

        # Majority vote
        final_class = max(set(predictions), key=predictions.count)
        avg_conf    = float(np.mean(confidences)) if confidences else 0.0
        result      = classes[final_class] if final_class < len(classes) else "Unknown"

        # ── Confidence Threshold Check ─────────────────────────
        if avg_conf < CONFIDENCE_THRESHOLD:
            return jsonify({
                "disease":     "Uncertain",
                "confidence":  f"{avg_conf:.1%}",
                "message":     "Model confidence is too low across video frames. Please record a closer video of the affected leaf.",
                "supplement":  None,
                "fertilizers": []
            }), 200

        return jsonify({
            "disease":     result,
            "confidence":  f"{avg_conf:.1%}",
            "supplement":  get_supplement(result),
            "fertilizers": get_fertilizers(result),
        })

    except Exception as e:
        print("[predict-video] ERROR:", str(e))
        return jsonify({"message": "Prediction failed", "error": str(e)}), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)


# ---------------- RUN SERVER ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)