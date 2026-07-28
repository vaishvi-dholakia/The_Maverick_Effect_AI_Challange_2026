import os
import cv2

def read_video(video_path="videos/traffic.mp4"):
    if not os.path.exists(video_path):
        print(f"Error: Video file '{video_path}' not found. Please place 'traffic.mp4' in 'python-ai/videos/'.")
        return

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print(f"Error: Failed to open video file '{video_path}'.")
        return

    print("Displaying video stream. Press 'q' to exit.")

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("End of video stream reached.")
            break

        resized_frame = cv2.resize(frame, (800, 600))
        cv2.imshow("Traffic Stream", resized_frame)

        if cv2.waitKey(25) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    default_path = os.path.join(base_dir, "videos", "traffic.mp4")
    read_video(default_path)
