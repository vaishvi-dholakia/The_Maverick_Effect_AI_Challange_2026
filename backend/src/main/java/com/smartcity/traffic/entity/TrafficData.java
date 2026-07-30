package com.smartcity.traffic.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "traffic_data")
public class TrafficData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String junctionId;
    private String junctionName;
    private String cameraId;

    private int totalVehicles;
    private int cars;
    private int motorcycles;
    private int buses;
    private int trucks;
    private int ambulanceCount;

    private String density;
    private String currentSignal;
    private int remainingSignalTime;
    private int greenTime;
    private int redTime;
    private int aiRecommendedGreenTime;
    private int queueLength;
    private double averageVehicleSpeed;
    private String emergencyStatus;
    private double aiConfidence;

    private LocalDateTime createdAt;

    public TrafficData() {}

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getJunctionId() { return junctionId; }
    public void setJunctionId(String junctionId) { this.junctionId = junctionId; }

    public String getJunctionName() { return junctionName; }
    public void setJunctionName(String junctionName) { this.junctionName = junctionName; }

    public String getCameraId() { return cameraId; }
    public void setCameraId(String cameraId) { this.cameraId = cameraId; }

    public int getTotalVehicles() { return totalVehicles; }
    public void setTotalVehicles(int totalVehicles) { this.totalVehicles = totalVehicles; }

    public int getCars() { return cars; }
    public void setCars(int cars) { this.cars = cars; }

    public int getMotorcycles() { return motorcycles; }
    public void setMotorcycles(int motorcycles) { this.motorcycles = motorcycles; }

    public int getBuses() { return buses; }
    public void setBuses(int buses) { this.buses = buses; }

    public int getTrucks() { return trucks; }
    public void setTrucks(int trucks) { this.trucks = trucks; }

    public int getAmbulanceCount() { return ambulanceCount; }
    public void setAmbulanceCount(int ambulanceCount) { this.ambulanceCount = ambulanceCount; }

    public String getDensity() { return density; }
    public void setDensity(String density) { this.density = density; }

    public String getCurrentSignal() { return currentSignal; }
    public void setCurrentSignal(String currentSignal) { this.currentSignal = currentSignal; }

    public int getRemainingSignalTime() { return remainingSignalTime; }
    public void setRemainingSignalTime(int remainingSignalTime) { this.remainingSignalTime = remainingSignalTime; }

    public int getGreenTime() { return greenTime; }
    public void setGreenTime(int greenTime) { this.greenTime = greenTime; }

    public int getRedTime() { return redTime; }
    public void setRedTime(int redTime) { this.redTime = redTime; }

    public int getAiRecommendedGreenTime() { return aiRecommendedGreenTime; }
    public void setAiRecommendedGreenTime(int aiRecommendedGreenTime) { this.aiRecommendedGreenTime = aiRecommendedGreenTime; }

    public int getQueueLength() { return queueLength; }
    public void setQueueLength(int queueLength) { this.queueLength = queueLength; }

    public double getAverageVehicleSpeed() { return averageVehicleSpeed; }
    public void setAverageVehicleSpeed(double averageVehicleSpeed) { this.averageVehicleSpeed = averageVehicleSpeed; }

    public String getEmergencyStatus() { return emergencyStatus; }
    public void setEmergencyStatus(String emergencyStatus) { this.emergencyStatus = emergencyStatus; }

    public double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(double aiConfidence) { this.aiConfidence = aiConfidence; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
