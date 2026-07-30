import os
import cv2
import numpy as np
import supervision as sv
from ultralytics import YOLO
from traffic_density import get_traffic_density

# Target vehicle classes
TARGET_CLASSES = {'car', 'motorcycle', 'bus', 'truck'}

def resolve_video_path(video_rel, base_dir):
    full_path = os.path.join(base_dir, video_rel) if not os.path.isabs(video_rel) else video_rel
    if os.path.exists(full_path):
        return full_path

    # Fallback to any available mp4 file in base_dir/videos
    videos_dir = os.path.join(base_dir, "videos")
    if os.path.exists(videos_dir):
        files = [f for f in os.listdir(videos_dir) if f.lower().endswith('.mp4')]
        if files:
            return os.path.join(videos_dir, files[0])
    return full_path

def run_tracker(video_path="videos/traffic.mp4"):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    resolved_path = resolve_video_path(video_path, base_dir)

    # Validate video existence
    if not os.path.exists(resolved_path):
        print(f"Error: Video file '{resolved_path}' not found. Please place '.mp4' in 'python-ai/videos/'.")
        return

    # Load YOLOv8 model & ByteTrack tracker
    print("Loading YOLOv8n and ByteTrack...")
    model = YOLO("yolov8n.pt")
    byte_tracker = sv.ByteTrack()

    # Retrieve target class IDs from COCO model
    target_class_ids = [cid for cid, name in model.names.items() if name in TARGET_CLASSES]

    cap = cv2.VideoCapture(resolved_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video '{resolved_path}'.")
        return

    # Track unique vehicle IDs for single-instance cumulative counting
    total_unique_ids = set()
    category_unique_ids = {'car': set(), 'motorcycle': set(), 'bus': set(), 'truck': set()}

    # Supervision annotators for boxes and labels
    box_annotator = sv.BoxAnnotator()
    label_annotator = sv.LabelAnnotator()

    print("ByteTrack Tracking Active. Press 'q' to exit.")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("Video stream finished.")
            break

        # Run YOLO inference
        results = model(frame, verbose=False)[0]

        # Convert to Supervision Detections & filter target classes
        detections = sv.Detections.from_ultralytics(results)
        filtered_detections = detections[np.isin(detections.class_id, target_class_ids)]

        # Update ByteTrack tracker
        tracked_detections = byte_tracker.update_with_detections(filtered_detections)

        current_cars = 0
        current_motorcycles = 0
        current_buses = 0
        current_trucks = 0

        # Process active detections and labels
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

                # Format label with tracking ID
                labels.append(f"ID #{tracker_id} {name}")

            # Draw boxes and tracking ID labels
            frame = box_annotator.annotate(scene=frame, detections=tracked_detections)
            frame = label_annotator.annotate(scene=frame, detections=tracked_detections, labels=labels)

        current_vehicles_in_frame = current_cars + current_motorcycles + current_buses + current_trucks
        total_vehicles_passed = len(total_unique_ids)
        density_label, density_color = get_traffic_density(current_vehicles_in_frame)

        # Draw vehicle counter telemetry panel on frame
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

        # Display window
        resized_frame = cv2.resize(frame, (800, 600))
        cv2.imshow("ByteTrack Vehicle Tracker", resized_frame)

        # Press Q to quit
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    video_file = os.path.join(base_dir, "videos", "traffic.mp4")
    run_tracker(video_file)

