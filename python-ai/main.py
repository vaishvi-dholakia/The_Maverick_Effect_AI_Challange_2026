from flask import Flask, jsonify, Response, request
from flask_cors import CORS
from detector import generate_frames

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "running"}), 200

@app.route('/video-feed', methods=['GET'])
def video_feed():
    junction_id = request.args.get('junction', 'J101')
    return Response(generate_frames(junction_id), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/video-feed/<junction_id>', methods=['GET'])
def video_feed_junction(junction_id):
    return Response(generate_frames(junction_id), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, threaded=True)
