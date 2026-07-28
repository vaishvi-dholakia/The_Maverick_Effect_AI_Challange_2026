import requests

BACKEND_URL = "http://localhost:8080/api/traffic/update"

def send_traffic_data(data_payload):
    """
    Sends traffic data payload to Spring Boot REST endpoint.
    Handles connection errors gracefully.
    """
    try:
        response = requests.post(BACKEND_URL, json=data_payload, timeout=2)
        if response.status_code == 200:
            print("Data Sent Successfully")
            return True
        else:
            print(f"Backend Returned Status: {response.status_code}")
            return False
    except requests.exceptions.RequestException:
        print("Backend Offline")
        return False
