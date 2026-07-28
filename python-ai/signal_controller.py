def get_signal_timing(density_label, is_emergency=False):
    """
    Recommends traffic signal timings based on traffic density level or emergency priority.
    
    Rules:
    - Emergency: Green = 90s, Red = 0s
    - Low      : Green = 20s, Red = 40s
    - Medium   : Green = 35s, Red = 35s
    - High     : Green = 50s, Red = 20s
    - Severe   : Green = 70s, Red = 10s
    """
    if is_emergency:
        return {
            "green": 90,
            "red": 0,
            "recommendation": "Priority Green Signal (Emergency)",
            "is_emergency": True
        }

    timings = {
        "Low": (20, 40, "Standard Cycle - Low Traffic"),
        "Medium": (35, 35, "Balanced Cycle - Medium Traffic"),
        "High": (50, 20, "Extended Green - High Traffic"),
        "Severe": (70, 10, "Priority Green - Severe Traffic")
    }

    green, red, recommendation = timings.get(density_label, (35, 35, "Balanced Cycle"))
    return {
        "green": green,
        "red": red,
        "recommendation": recommendation,
        "is_emergency": False
    }

def check_emergency_vehicle(detections, model_names):
    """
    Placeholder function for Emergency Vehicle Detection (Ambulance / Fire Truck).
    Standard COCO dataset does not separate emergency vehicles from standard trucks/cars.
    A fine-tuned custom YOLO model trained on emergency datasets can be plugged in here.
    """
    if detections is None or detections.class_id is None:
        return False

    emergency_classes = {"ambulance", "fire truck"}
    for class_id in detections.class_id:
        class_name = model_names.get(class_id, "").lower()
        if class_name in emergency_classes:
            return True
    return False
