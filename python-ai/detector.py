import os
import time
import cv2
import numpy as np
import supervision as sv
from ultralytics import YOLO
from traffic_density import get_traffic_density
from signal_controller import get_signal_timing, check_emergency_vehicle
from api_client import send_traffic_data

TARGET_CLASSES = {'car', 'motorcycle', 'bus', 'truck'}

JUNCTION_VIDEOS = {
    "J101": ("videos/traffic.mp4", 0),
    "J102": ("videos/traffic_b.mp4", 120),
    "J103": ("videos/traffic_c.mp4", 240),
    "J104": ("videos/traffic_d.mp4", 360)
}

# Global cached YOLO model instance to prevent CPU & RAM reload freeze
GLOBAL_YOLO_MODEL = None

def get_yolo_model():
    global GLOBAL_YOLO_MODEL
    if GLOBAL_YOLO_MODEL is None:
        print("Initializing Global YOLOv8n Computer Vision Model...")
        GLOBAL_YOLO_MODEL = YOLO("yolov8n.pt")
    return GLOBAL_YOLO_MODEL

def resolve_video_path(video_rel, base_dir):
    full_path = os.path.join(base_dir, video_rel)
    if os.path.exists(full_path):
        return full_path

    # Fallback to any available mp4 file in base_dir/videos
    videos_dir = os.path.join(base_dir, "videos")
    if os.path.exists(videos_dir):
        files = [f for f in os.listdir(videos_dir) if f.lower().endswith('.mp4')]
        if files:
            return os.path.join(videos_dir, files[0])
    return full_path

def generate_frames(junction_id="J101"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    video_rel, start_offset = JUNCTION_VIDEOS.get(junction_id, ("videos/traffic.mp4", 0))
    full_video_path = resolve_video_path(video_rel, base_dir)

    # Check if specific video file exists for this junction
    if not os.path.exists(full_video_path):
        print(f"Notice: Video file for {junction_id} not found at '{full_video_path}'. Displaying placeholder frame.")
        error_frame = np.zeros((600, 800, 3), dtype=np.uint8)
        cv2.putText(error_frame, "VIDEO IS NOT AVAILABLE", (180, 280),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 165, 255), 2)
        cv2.putText(error_frame, f"Camera: {junction_id} | Add valid .mp4 to python-ai/videos/", (140, 340),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        ret, buffer = cv2.imencode('.jpg', error_frame)
        frame_bytes = buffer.tobytes()
        while True:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(1.0)

    model = get_yolo_model()
    byte_tracker = sv.ByteTrack()
    target_class_ids = [cid for cid, name in model.names.items() if name in TARGET_CLASSES]

    cap = cv2.VideoCapture(full_video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video file '{full_video_path}'. File may be corrupt or link text.")
        error_frame = np.zeros((600, 800, 3), dtype=np.uint8)
        cv2.putText(error_frame, f"INVALID VIDEO FILE ({junction_id})", (160, 280),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 2)
        cv2.putText(error_frame, "Copy real .mp4 video into python-ai/videos/", (170, 340),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        ret, buffer = cv2.imencode('.jpg', error_frame)
        frame_bytes = buffer.tobytes()
        while True:
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            time.sleep(1.0)

    if start_offset > 0:
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 1000)
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_offset % total_frames)

    total_unique_ids = set()
    category_unique_ids = {'car': set(), 'motorcycle': set(), 'bus': set(), 'truck': set()}

    box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    last_api_send_time = 0

    while True:
        if not cap.isOpened():
            cap = cv2.VideoCapture(full_video_path)

        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        # Run YOLO Object Detection & Vehicle Tracking via ByteTrack
        results = model(frame, verbose=False)[0]
        detections = sv.Detections.from_ultralytics(results)
        filtered_detections = detections[np.isin(detections.class_id, target_class_ids)]
        tracked_detections = byte_tracker.update_with_detections(filtered_detections)

        current_cars = 0
        current_motorcycles = 0
        current_buses = 0
        current_trucks = 0

        if tracked_detections.tracker_id is not None and len(tracked_detections.tracker_id) > 0:
            labels = []
            for tracker_id, class_id in zip(tracked_detections.tracker_id, tracked_detections.class_id):
                name = model.names[class_id]
                total_unique_ids.add(tracker_id)
                if name in category_unique_ids:
                    category_unique_ids[name].add(tracker_id)

                if name == 'car':
                    current_cars += 1
                elif name == 'motorcycle':
                    current_motorcycles += 1
                elif name == 'bus':
                    current_buses += 1
                elif name == 'truck':
                    current_trucks += 1

                labels.append(f"ID #{tracker_id} {name}")

            frame = box_annotator.annotate(scene=frame, detections=tracked_detections)
            frame = label_annotator.annotate(scene=frame, detections=tracked_detections, labels=labels)

        current_vehicles_in_frame = current_cars + current_motorcycles + current_buses + current_trucks
        total_vehicles_passed = len(total_unique_ids)

        # Traffic density calculated strictly from Current Vehicles in Frame
        density_label, density_color = get_traffic_density(current_vehicles_in_frame)
        is_emergency = check_emergency_vehicle(detections, model.names)
        timing = get_signal_timing(density_label, is_emergency=is_emergency)

        # Display overlay panel on frame: Current Vehicles in Frame, Total Vehicles Passed, Density
        cv2.rectangle(frame, (10, 10), (320, 145), (0, 0, 0), -1)
        cv2.rectangle(frame, (10, 10), (320, 145), (255, 255, 255), 1)
        cv2.putText(frame, f"Current in Frame: {current_vehicles_in_frame}", (20, 35),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 255), 2)
        cv2.putText(frame, f"Total Passed: {total_vehicles_passed}", (20, 60),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 255, 0), 2)
        cv2.putText(frame, f"Density: {density_label}", (20, 85),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.65, density_color, 2)
        cv2.putText(frame, f"Cars: {current_cars} | Moto: {current_motorcycles}", (20, 110),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)
        cv2.putText(frame, f"Buses: {current_buses} | Trucks: {current_trucks}", (20, 130),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)

        # Broadcast telemetry payload every 1 second
        curr_time = time.time()
        if curr_time - last_api_send_time >= 1.0:
            payload = {
                "junctionId": junction_id,
                "totalVehicles": current_vehicles_in_frame,
                "totalVehiclesPassed": total_vehicles_passed,
                "cars": current_cars,
                "motorcycles": current_motorcycles,
                "buses": current_buses,
                "trucks": current_trucks,
                "density": density_label,
                "greenTime": timing['green'],
                "redTime": timing['red']
            }
            send_traffic_data(payload)
            last_api_send_time = curr_time

        resized_frame = cv2.resize(frame, (800, 600))
        ret_encode, buffer = cv2.imencode('.jpg', resized_frame)
        if not ret_encode:
            continue

        frame_bytes = buffer.tobytes()
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

def run_detector(video_path="videos/traffic.mp4"):
    for _ in generate_frames("J101"):
        pass

if __name__ == '__main__':
    run_detector()

