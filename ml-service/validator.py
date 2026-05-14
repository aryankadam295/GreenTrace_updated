import numpy as np


def validate_image_quality(img_bgr):
    """
    Validate basic image quality.
    - img_bgr: BGR numpy array (as decoded by cv2)
    Returns: (bool, message)
    """
    if img_bgr is None:
        return False, "Image is empty or could not be decoded"

    if not isinstance(img_bgr, np.ndarray):
        return False, "Invalid image type"

    if img_bgr.size == 0:
        return False, "Image has no data"

    # Ensure image has three channels
    if img_bgr.ndim < 2:
        return False, "Image has invalid dimensions"

    h, w = img_bgr.shape[:2]
    if h < 50 or w < 50:
        return False, f"Image too small ({w}x{h})"

    # Check for near-blank images (very low variance)
    # Compute standard deviation across color channels
    std = float(np.std(img_bgr))
    if std < 8.0:
        return False, "Image has very low variance (likely blank or uniform)"

    return True, "OK"


def is_plant_image(img_bgr):
    """
    Very lightweight plant detector using green-channel heuristics.
    - Computes ratio of pixels where green channel is dominant (G > R and G > B)
    - Returns (bool, message). Reject if green-dominant pixel ratio < 15%.

    Note: This is a heuristic and not a substitute for a learned classifier. It is intended
    to quickly filter out obvious non-plant uploads (cars, humans, documents, etc.).
    """
    if img_bgr is None or not isinstance(img_bgr, np.ndarray):
        return False, "Image is empty or invalid"

    # Convert to 3-channel if grayscale
    if img_bgr.ndim == 2:
        # single channel; treat as non-plant
        return False, "Image is grayscale and unlikely to be a plant"

    if img_bgr.shape[2] < 3:
        return False, "Image does not have 3 colour channels"

    # Extract channels (B,G,R)
    b = img_bgr[:, :, 0].astype(np.int32)
    g = img_bgr[:, :, 1].astype(np.int32)
    r = img_bgr[:, :, 2].astype(np.int32)

    # Create mask of non-black pixels to avoid counting padding
    brightness = (r + g + b) / 3
    valid_mask = brightness > 10  # ignore near-black pixels
    valid_count = np.count_nonzero(valid_mask)
    if valid_count == 0:
        return False, "Image contains only very dark pixels"

    # Green-dominant pixels
    green_dominant = (g > r) & (g > b) & (g > 40)
    green_dominant_count = int(np.count_nonzero(green_dominant & valid_mask))

    green_ratio = green_dominant_count / valid_count

    if green_ratio < 0.15:
        return False, f"Low green ratio ({green_ratio:.2%}) - not likely a plant"

    return True, f"OK (green ratio {green_ratio:.2%})"
