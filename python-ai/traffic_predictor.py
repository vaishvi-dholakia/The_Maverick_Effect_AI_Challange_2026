import time
import numpy as np

class TrafficPredictor:
    def __init__(self):
        self.history = []

    def add_record(self, total_vehicles, density):
        timestamp = time.time()
        self.history.append({'time': timestamp, 'count': total_vehicles, 'density': density})
        if len(self.history) > 30:
            self.history.pop(0)

    def predict(self):
        if not self.history:
            return {
                "currentVehicles": 10,
                "currentDensity": "LOW",
                "predicted2Min": 12,
                "predicted5Min": 15,
                "predicted10Min": 18,
                "predictedDensity": "LOW",
                "confidence": 95.0,
                "recommendedGreen": 35,
                "expectedWait": "45s",
                "co2Reduction": "15%",
                "reason": "Stable Traffic Flow"
            }

        current_count = self.history[-1]['count']
        current_density = self.history[-1]['density']

        # Rule-based vehicle growth rate calculation from history trend
        if len(self.history) >= 3:
            recent_counts = [r['count'] for r in self.history[-5:]]
            growth_rate = np.mean(np.diff(recent_counts)) if len(recent_counts) > 1 else 0.5
        else:
            growth_rate = 0.5

        # Calculate predicted vehicle counts for 2min, 5min, 10min intervals
        pred_2min = max(0, int(round(current_count + growth_rate * 2.0)))
        pred_5min = max(0, int(round(current_count + growth_rate * 5.0)))
        pred_10min = max(0, int(round(current_count + growth_rate * 10.0)))

        # Determine predicted density level
        max_pred = max(pred_2min, pred_5min, pred_10min)
        if max_pred >= 25:
            pred_density = "SEVERE"
            recommended_green = 65
            reason = "Rapid Vehicle Accumulation Detected"
        elif max_pred >= 18:
            pred_density = "HIGH"
            recommended_green = 50
            reason = "Vehicle Growth Rate Increasing"
        elif max_pred >= 10:
            pred_density = "MEDIUM"
            recommended_green = 40
            reason = "Moderate Traffic Trend Predicted"
        else:
            pred_density = "LOW"
            recommended_green = 35
            reason = "Normal Traffic Flow Operating Smoothly"

        confidence = round(min(98.5, max(85.0, 92.0 + len(self.history) * 0.2)), 1)
        expected_wait = f"{max(30, int(recommended_green * 1.2))}s"
        co2_reduction = f"{min(35, max(12, int(recommended_green * 0.4)))}%"

        return {
            "currentVehicles": current_count,
            "currentDensity": current_density,
            "predicted2Min": pred_2min,
            "predicted5Min": pred_5min,
            "predicted10Min": pred_10min,
            "predictedDensity": pred_density,
            "confidence": confidence,
            "recommendedGreen": recommended_green,
            "expectedWait": expected_wait,
            "co2Reduction": co2_reduction,
            "reason": reason
        }

predictor_instance = TrafficPredictor()
