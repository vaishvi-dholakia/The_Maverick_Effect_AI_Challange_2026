import os
import cv2
import numpy as np
import supervision as sv
from ultralytics import YOLO

# Target vehicle classes
TARGET_CLASSES = {'car', 'motorcycle', 'bus', 'truck'}

def run_tracker(video_path="videos/traffic.mp4"):
    # Validate video existence
    if not os.path.exists(video_path):
        print(f"Error: Video file '{video_path}' not found. Please place 'traffic.mp4' in 'python-ai/videos/'.")
        return

    # Load YOLOv8 model & ByteTrack tracker
    print("Loading YOLOv8n and ByteTrack...")
    model = YOLO("yolov8n.pt")
    byte_tracker = sv.ByteTrack()

    # Retrieve target class IDs from COCO model
    target_class_ids = [cid for cid, name in model.names.items() if name in TARGET_CLASSES]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error: Cannot open video '{video_path}'.")
        return

    # Track unique vehicle IDs for single-instance counting
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
        detections = detections[np.isin(detections.class_id, target_class_ids)]

        # Update ByteTrack tracker
        detections = byte_tracker.update_with_detections(detections)

        # Process active detections and labels
        if detections.tracker_id is not None:
            labels = []
            for tracker_id, class_id in zip(detections.tracker_id, detections.class_id):
                name = model.names[class_id]
                total_unique_ids.add(tracker_id)
                if name in category_unique_ids:
                    category_unique_ids[name].add(tracker_id)

                # Format label with tracking ID
                labels.append(f"ID #{tracker_id} {name}")

            # Draw boxes and tracking ID labels
            frame = box_annotator.annotate(scene=frame, detections=detections)
            frame = label_annotator.annotate(scene=frame, detections=detections, labels=labels)

        # Draw vehicle counter panel on frame
        cv2.rectangle(frame, (10, 10), (280, 140), (0, 0, 0), -1)
        cv2.putText(frame, f"Total Vehicles: {len(total_unique_ids)}", (20, 32),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(frame, f"Cars: {len(category_unique_ids['car'])}", (20, 55),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"Motorcycles: {len(category_unique_ids['motorcycle'])}", (20, 75),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"Buses: {len(category_unique_ids['bus'])}", (20, 95),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"Trucks: {len(category_unique_ids['truck'])}", (20, 115),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

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
