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

def generate_frames(junction_id="J101"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    video_rel, start_offset = JUNCTION_VIDEOS.get(junction_id, ("videos/traffic.mp4", 0))
    full_video_path = os.path.join(base_dir, video_rel)

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

        # Run YOLO Object Detection & Vehicle Tracking
        results = model(frame, verbose=False)[0]
        detections = sv.Detections.from_ultralytics(results)
        filtered_detections = detections[np.isin(detections.class_id, target_class_ids)]
        tracked_detections = byte_tracker.update_with_detections(filtered_detections)

        if tracked_detections.tracker_id is not None:
            labels = []
            for tracker_id, class_id in zip(tracked_detections.tracker_id, tracked_detections.class_id):
                name = model.names[class_id]
                total_unique_ids.add(tracker_id)
                if name in category_unique_ids:
                    category_unique_ids[name].add(tracker_id)
                labels.append(f"ID #{tracker_id} {name}")

            frame = box_annotator.annotate(scene=frame, detections=tracked_detections)
            frame = label_annotator.annotate(scene=frame, detections=tracked_detections, labels=labels)

        total_vehicles = len(total_unique_ids)
        cars_count = len(category_unique_ids['car'])
        motorcycles_count = len(category_unique_ids['motorcycle'])
        buses_count = len(category_unique_ids['bus'])
        trucks_count = len(category_unique_ids['truck'])

        density_label, density_color = get_traffic_density(total_vehicles)
        is_emergency = check_emergency_vehicle(detections, model.names)
        timing = get_signal_timing(density_label, is_emergency=is_emergency)

        # Broadcast telemetry payload every 1 second
        curr_time = time.time()
        if curr_time - last_api_send_time >= 1.0:
            payload = {
                "junctionId": junction_id,
                "totalVehicles": total_vehicles,
                "cars": cars_count,
                "motorcycles": motorcycles_count,
                "buses": buses_count,
                "trucks": trucks_count,
                "density": density_label,
                "greenTime": timing['green'],
                "redTime": timing['red']
            }
            send_traffic_data(payload)
            last_api_send_time = curr_time

        # Clear video stream output (Telemetry displayed cleanly under video in web UI)

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
