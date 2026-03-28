import json
from pathlib import Path

import tensorflow as tf
import numpy as np
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import ImageDataGenerator

DATASET_PATH = Path("dataset")
IMG_SIZE = 224
BATCH_SIZE = 32
INITIAL_EPOCHS = 8
FINE_TUNE_EPOCHS = 5
SEED = 42


def scan_class_distribution():
    class_counts = {}
    for class_dir in sorted(DATASET_PATH.iterdir()):
        if class_dir.is_dir():
            count = sum(1 for p in class_dir.iterdir() if p.is_file())
            class_counts[class_dir.name] = count
    return class_counts


def build_generators():
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255.0,
        validation_split=0.2,
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        zoom_range=0.15,
        horizontal_flip=True,
        fill_mode="nearest",
    )

    valid_datagen = ImageDataGenerator(rescale=1.0 / 255.0, validation_split=0.2)

    train_generator = train_datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="training",
        shuffle=True,
        seed=SEED,
    )

    validation_generator = valid_datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(IMG_SIZE, IMG_SIZE),
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        subset="validation",
        shuffle=False,
        seed=SEED,
    )

    return train_generator, validation_generator


def build_model(num_classes):
    base_model = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
    )
    base_model.trainable = False

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dropout(0.3)(x)
    x = Dense(256, activation="relu")(x)
    x = Dropout(0.2)(x)
    outputs = Dense(num_classes, activation="softmax")(x)

    model = Model(inputs=base_model.input, outputs=outputs)
    model.compile(optimizer="adam", loss="categorical_crossentropy", metrics=["accuracy"])

    return model, base_model


def main():
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset folder not found: {DATASET_PATH}")

    class_counts = scan_class_distribution()
    if not class_counts:
        raise RuntimeError("No class folders found inside dataset directory.")

    print("Dataset class distribution (images per class):")
    for name, count in class_counts.items():
        print(f"  {name}: {count}")
    print(
        f"Summary -> classes: {len(class_counts)}, min: {min(class_counts.values())}, max: {max(class_counts.values())}"
    )

    train_gen, val_gen = build_generators()
    num_classes = train_gen.num_classes
    print(f"Detected classes: {num_classes}")
    print(train_gen.class_indices)

    # Save class order used by training for inference.
    class_indices = train_gen.class_indices
    index_to_class = {idx: name for name, idx in class_indices.items()}
    with open("class_indices.json", "w", encoding="utf-8") as f:
        json.dump(index_to_class, f, indent=2, ensure_ascii=False)

    model, base_model = build_model(num_classes)

    train_labels = train_gen.classes
    class_sample_counts = np.bincount(train_labels, minlength=num_classes)
    total_samples = float(class_sample_counts.sum())
    class_weights = {
        i: float(total_samples / (num_classes * count))
        for i, count in enumerate(class_sample_counts)
        if count > 0
    }
    print("Using class weights:")
    for idx, weight in class_weights.items():
        print(f"  {index_to_class[idx]}: {weight:.4f}")

    callbacks = [
        ModelCheckpoint("crop_disease_model_best.h5", monitor="val_accuracy", save_best_only=True),
        EarlyStopping(monitor="val_loss", patience=4, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.3, patience=2, min_lr=1e-6),
    ]

    print("Training stage 1: feature extraction")
    history_stage1 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=INITIAL_EPOCHS,
        callbacks=callbacks,
        class_weight=class_weights,
    )

    print("Training stage 2: fine-tuning")
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history_stage2 = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=INITIAL_EPOCHS + FINE_TUNE_EPOCHS,
        initial_epoch=history_stage1.epoch[-1] + 1,
        callbacks=callbacks,
        class_weight=class_weights,
    )

    model.save("crop_disease_model.h5")

    history = {
        "stage1": history_stage1.history,
        "stage2": history_stage2.history,
        "classes": index_to_class,
    }
    with open("training_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

    print("Saved: crop_disease_model.h5, crop_disease_model_best.h5, class_indices.json, training_history.json")


if __name__ == "__main__":
    main()
