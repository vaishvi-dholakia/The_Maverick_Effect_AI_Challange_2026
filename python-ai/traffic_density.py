def get_traffic_density(vehicle_count):
    """
    Classifies traffic density level and corresponding BGR color.
    0–10  : Low (Green)
    11–20 : Medium (Yellow)
    21–35 : High (Orange)
    >35   : Severe (Red)
    """
    if vehicle_count <= 10:
        return "Low", (0, 255, 0)
    elif vehicle_count <= 20:
        return "Medium", (0, 255, 255)
    elif vehicle_count <= 35:
        return "High", (0, 165, 255)
    else:
        return "Severe", (0, 0, 255)
