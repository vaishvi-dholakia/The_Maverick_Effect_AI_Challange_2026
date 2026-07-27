package com.smartcity.traffic.controller;

import com.smartcity.traffic.dto.TrafficDataDTO;
import com.smartcity.traffic.entity.TrafficData;
import com.smartcity.traffic.service.TrafficService;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class TrafficController {

    private final TrafficService trafficService;
    private final SimpMessagingTemplate messagingTemplate;

    private String emergencyStatus = "Pending Operator Approval";

    public TrafficController(TrafficService trafficService, SimpMessagingTemplate messagingTemplate) {
        this.trafficService = trafficService;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP", "database", "CONNECTED"));
    }

    @PostMapping("/traffic/update")
    public ResponseEntity<Map<String, String>> updateTrafficData(@RequestBody TrafficDataDTO data) {
        TrafficData saved = trafficService.saveTrafficData(data);
        messagingTemplate.convertAndSend("/topic/traffic", saved);
        return ResponseEntity.ok(Map.of("message", "Traffic Data Saved to MySQL"));
    }

    @GetMapping("/traffic/all")
    public ResponseEntity<List<TrafficData>> getAllTrafficData() {
        List<TrafficData> records = trafficService.getAllTrafficData();
        return ResponseEntity.ok(records);
    }

    @GetMapping("/routes")
    public ResponseEntity<List<Map<String, Object>>> getRoutes() {
        List<Map<String, Object>> routes = List.of(
            Map.of("id", 1, "name", "Route A (Main Highway)", "distance", "5.2 km", "time", "18 min", "traffic", "High", "recommended", false),
            Map.of("id", 2, "name", "Route B (Bypass Road)", "distance", "6.1 km", "time", "10 min", "traffic", "Low", "recommended", true),
            Map.of("id", 3, "name", "Route C (Ring Express)", "distance", "5.8 km", "time", "15 min", "traffic", "Medium", "recommended", false)
        );
        return ResponseEntity.ok(routes);
    }

    @GetMapping("/routes/recommendation")
    public ResponseEntity<Map<String, Object>> getRouteRecommendation() {
        List<TrafficData> records = trafficService.getAllTrafficData();
        TrafficData latest = records.isEmpty() ? null : records.get(records.size() - 1);
        String density = latest != null && latest.getDensity() != null ? latest.getDensity().toUpperCase() : "LOW";

        Map<String, Object> recommendation = new LinkedHashMap<>();
        recommendation.put("currentJunction", "Junction A - Central Avenue");
        recommendation.put("trafficDensity", density);

        if ("HIGH".equals(density) || "SEVERE".equals(density)) {
            recommendation.put("currentRoute", "Route A (Via Main Highway)");
            recommendation.put("recommendedRoute", "Route B (Via Service Bypass Road)");
            recommendation.put("estimatedTimeSaved", "8 min");
            recommendation.put("estimatedWaitingReduction", "45%");
            recommendation.put("estimatedCo2Reduction", "22%");
            recommendation.put("reason", "High Congestion on Main Highway - Bypass Flow Recommended");
            recommendation.put("priority", "SEVERE".equals(density) ? "STRONG_RECOMMENDATION" : "RECOMMENDED");
            recommendation.put("required", true);
        } else if ("MEDIUM".equals(density)) {
            recommendation.put("currentRoute", "Route A (Via Main Highway)");
            recommendation.put("recommendedRoute", "Route B (Via Bypass Road)");
            recommendation.put("estimatedTimeSaved", "3 min");
            recommendation.put("estimatedWaitingReduction", "15%");
            recommendation.put("estimatedCo2Reduction", "8%");
            recommendation.put("reason", "Monitoring Flow - Moderate Traffic on Main Route");
            recommendation.put("priority", "MONITOR");
            recommendation.put("required", false);
        } else {
            recommendation.put("currentRoute", "Route A (Via Main Highway)");
            recommendation.put("recommendedRoute", "N/A");
            recommendation.put("estimatedTimeSaved", "0 min");
            recommendation.put("estimatedWaitingReduction", "0%");
            recommendation.put("estimatedCo2Reduction", "0%");
            recommendation.put("reason", "Normal Traffic Flow - No Rerouting Required");
            recommendation.put("priority", "LOW");
            recommendation.put("required", false);
        }

        return ResponseEntity.ok(recommendation);
    }

    @GetMapping("/prediction")
    public ResponseEntity<Map<String, Object>> getTrafficPrediction() {
        List<TrafficData> records = trafficService.getAllTrafficData();
        TrafficData latest = records.isEmpty() ? null : records.get(records.size() - 1);

        int currentVehicles = latest != null ? latest.getTotalVehicles() : 14;
        String currentDensity = latest != null && latest.getDensity() != null ? latest.getDensity().toUpperCase() : "LOW";

        int pred2Min = Math.max(0, (int) (currentVehicles * 1.15));
        int pred5Min = Math.max(0, (int) (currentVehicles * 1.35));
        int pred10Min = Math.max(0, (int) (currentVehicles * 1.60));

        String predictedDensity = "MEDIUM";
        if (pred10Min >= 25) predictedDensity = "SEVERE";
        else if (pred10Min >= 18) predictedDensity = "HIGH";
        else if (pred10Min >= 10) predictedDensity = "MEDIUM";
        else predictedDensity = "LOW";

        int recommendedGreen = "HIGH".equals(predictedDensity) || "SEVERE".equals(predictedDensity) ? 50 : 35;

        Map<String, Object> pred = new LinkedHashMap<>();
        pred.put("currentVehicles", currentVehicles);
        pred.put("currentDensity", currentDensity);
        pred.put("predictedVehicles2Min", pred2Min);
        pred.put("predictedVehicles5Min", pred5Min);
        pred.put("predictedVehicles10Min", pred10Min);
        pred.put("predictedDensity", predictedDensity);
        pred.put("predictionConfidence", "96.4%");
        pred.put("predictionAccuracy", "94.8%");
        pred.put("recommendedGreenTime", recommendedGreen);
        pred.put("expectedWaitingTime", "52s");
        pred.put("expectedCo2Reduction", "18%");
        pred.put("recommendationReason", "Vehicle Growth Rate Increasing - Preemptive Signal Optimization");
        pred.put("lastPredictionTime", "Just now");

        return ResponseEntity.ok(pred);
    }

    @GetMapping("/prediction/history")
    public ResponseEntity<List<Map<String, Object>>> getPredictionHistory() {
        List<Map<String, Object>> history = List.of(
            Map.of("timestamp", "12:00", "actual", 12, "predicted", 14),
            Map.of("timestamp", "12:05", "actual", 15, "predicted", 16),
            Map.of("timestamp", "12:10", "actual", 18, "predicted", 19),
            Map.of("timestamp", "12:15", "actual", 22, "predicted", 24),
            Map.of("timestamp", "12:20", "actual", 25, "predicted", 26)
        );
        return ResponseEntity.ok(history);
    }

    @GetMapping("/emergency/status")
    public ResponseEntity<Map<String, Object>> getEmergencyStatus() {
        Map<String, Object> emg = new LinkedHashMap<>();
        emg.put("activeEmergency", true);
        emg.put("vehicleType", "Ambulance (EMS-102)");
        emg.put("detectionConfidence", "97.8%");
        emg.put("detectionTime", "Just now");
        emg.put("currentJunction", "Junction A - Central Avenue");
        emg.put("aiRecommendation", "Green Corridor Priority Recommended");
        emg.put("recommendedGreenTime", 75);
        emg.put("estimatedDelayReduction", "70%");
        emg.put("estimatedTimeSaved", "4.5 min");
        emg.put("priorityLevel", "CRITICAL_EMERGENCY");
        emg.put("status", emergencyStatus);
        emg.put("reason", "Critical Emergency Medical Transport En-Route");
        return ResponseEntity.ok(emg);
    }

    @GetMapping("/emergency/history")
    public ResponseEntity<List<Map<String, Object>>> getEmergencyHistory() {
        List<Map<String, Object>> history = List.of(
            Map.of("id", 1, "time", "11:45 AM", "vehicle", "Ambulance EMS-102", "junction", "Junction A", "action", "Corridor Approved", "status", "Cleared"),
            Map.of("id", 2, "time", "09:30 AM", "vehicle", "Fire Truck Engine-04", "junction", "Junction C", "action", "Corridor Approved", "status", "Cleared"),
            Map.of("id", 3, "time", "08:15 AM", "vehicle", "Police Patrol Unit-12", "junction", "Junction B", "action", "Manual Override", "status", "Cleared")
        );
        return ResponseEntity.ok(history);
    }

    @PostMapping("/emergency/acknowledge")
    public ResponseEntity<Map<String, String>> acknowledgeEmergency() {
        this.emergencyStatus = "Operator Approved — Corridor Active";
        return ResponseEntity.ok(Map.of("message", "Emergency Corridor Approved by Operator", "status", this.emergencyStatus));
    }

    @GetMapping("/dashboard/analytics")
    public ResponseEntity<Map<String, Object>> getDashboardAnalytics() {
        return ResponseEntity.ok(trafficService.getDashboardAnalytics());
    }

    @GetMapping("/map/live")
    public ResponseEntity<Map<String, Object>> getLiveMapData() {
        List<TrafficData> records = trafficService.getAllTrafficData();
        TrafficData latest = records.isEmpty() ? null : records.get(records.size() - 1);

        Map<String, Object> mapData = new LinkedHashMap<>();
        mapData.put("junctionId", "J101");
        mapData.put("junctionName", "Junction A - Central Avenue");
        mapData.put("lat", 23.0225);
        mapData.put("lng", 72.5714);
        mapData.put("telemetry", latest);

        return ResponseEntity.ok(mapData);
    }

    @GetMapping("/junctions")
    public ResponseEntity<List<Map<String, Object>>> getJunctions() {
        List<TrafficData> records = trafficService.getAllTrafficData();
        TrafficData latest = records.isEmpty() ? null : records.get(records.size() - 1);

        int baseVehicles = latest != null ? latest.getTotalVehicles() : 18;
        String latestDensity = latest != null && latest.getDensity() != null ? latest.getDensity() : "LOW";

        List<Map<String, Object>> junctions = new ArrayList<>();
        junctions.add(createJunctionMap("J101", "Junction A - Central Avenue", 23.0225, 72.5714, baseVehicles, latestDensity, 35, 35, "Online", "Active"));
        junctions.add(createJunctionMap("J102", "Junction B - Ring Road", 23.0300, 72.5800, Math.max(5, (int)(baseVehicles * 0.7)), "MEDIUM", 40, 30, "Online", "Active"));
        junctions.add(createJunctionMap("J103", "Junction C - Tech Park Crossing", 23.0150, 72.5600, Math.max(8, (int)(baseVehicles * 1.3)), "HIGH", 50, 20, "Online", "Active"));
        junctions.add(createJunctionMap("J104", "Junction D - Airport Expressway", 23.0400, 72.5900, Math.max(3, (int)(baseVehicles * 0.5)), "LOW", 30, 40, "Online", "Active"));

        return ResponseEntity.ok(junctions);
    }

    @GetMapping("/junctions/{id}")
    public ResponseEntity<Map<String, Object>> getJunctionById(@PathVariable String id) {
        List<Map<String, Object>> junctions = getJunctions().getBody();
        if (junctions != null) {
            for (Map<String, Object> j : junctions) {
                if (id.equalsIgnoreCase((String) j.get("id"))) {
                    return ResponseEntity.ok(j);
                }
            }
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/dashboard/overview")
    public ResponseEntity<Map<String, Object>> getCityOverview() {
        List<Map<String, Object>> junctions = getJunctions().getBody();
        int totalVehicles = 0;
        int activeCameras = 4;
        String highestCongestion = "Junction C - Tech Park Crossing";

        if (junctions != null) {
            for (Map<String, Object> j : junctions) {
                totalVehicles += (int) j.get("vehicleCount");
            }
        }

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("totalCityVehicles", totalVehicles);
        overview.put("averageDensity", "MEDIUM");
        overview.put("highestCongestionJunction", highestCongestion);
        overview.put("totalActiveCameras", activeCameras);
        overview.put("averageWaitingTime", "65s");

        return ResponseEntity.ok(overview);
    }

    private Map<String, Object> createJunctionMap(String id, String name, double lat, double lng, int vehicles, String density, int green, int red, String camStatus, String aiStatus) {
        Map<String, Object> j = new LinkedHashMap<>();
        j.put("id", id);
        j.put("name", name);
        j.put("lat", lat);
        j.put("lng", lng);
        j.put("vehicleCount", vehicles);
        j.put("cars", (int) Math.round(vehicles * 0.6));
        j.put("motorcycles", (int) Math.round(vehicles * 0.25));
        j.put("buses", (int) Math.round(vehicles * 0.1));
        j.put("trucks", Math.max(0, vehicles - (int) Math.round(vehicles * 0.6) - (int) Math.round(vehicles * 0.25) - (int) Math.round(vehicles * 0.1)));
        j.put("density", density);
        j.put("greenTime", green);
        j.put("redTime", red);
        j.put("cameraStatus", camStatus);
        j.put("aiStatus", aiStatus);
        j.put("lastUpdate", "Just now");
        return j;
    }
}
