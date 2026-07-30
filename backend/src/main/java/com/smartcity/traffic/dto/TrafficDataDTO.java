package com.smartcity.traffic.dto;

public class TrafficDataDTO {

    private String junctionId;
    private String junctionName;
    private String cameraId;

    private int totalVehicles;
    private int vehicleCount;
    private int cars;
    private int carCount;
    private int motorcycles;
    private int bikeCount;
    private int buses;
    private int busCount;
    private int trucks;
    private int truckCount;
    private int ambulanceCount;

    private String density;
    private String trafficDensity;
    private String currentSignal;
    private int remainingSignalTime;
    private int greenTime;
    private int redTime;
    private int aiRecommendedGreenTime;
    private int queueLength;
    private double averageVehicleSpeed;
    private String emergencyStatus;
    private double aiConfidence;

    public TrafficDataDTO() {}

    public String getJunctionId() { return junctionId; }
    public void setJunctionId(String junctionId) { this.junctionId = junctionId; }

    public String getJunctionName() { return junctionName; }
    public void setJunctionName(String junctionName) { this.junctionName = junctionName; }

    public String getCameraId() { return cameraId; }
    public void setCameraId(String cameraId) { this.cameraId = cameraId; }

    public int getTotalVehicles() { return totalVehicles > 0 ? totalVehicles : vehicleCount; }
    public void setTotalVehicles(int totalVehicles) { this.totalVehicles = totalVehicles; }

    public int getVehicleCount() { return vehicleCount > 0 ? vehicleCount : totalVehicles; }
    public void setVehicleCount(int vehicleCount) { this.vehicleCount = vehicleCount; }

    public int getCars() { return cars > 0 ? cars : carCount; }
    public void setCars(int cars) { this.cars = cars; }

    public int getCarCount() { return carCount > 0 ? carCount : cars; }
    public void setCarCount(int carCount) { this.carCount = carCount; }

    public int getMotorcycles() { return motorcycles > 0 ? motorcycles : bikeCount; }
    public void setMotorcycles(int motorcycles) { this.motorcycles = motorcycles; }

    public int getBikeCount() { return bikeCount > 0 ? bikeCount : motorcycles; }
    public void setBikeCount(int bikeCount) { this.bikeCount = bikeCount; }

    public int getBuses() { return buses > 0 ? buses : busCount; }
    public void setBuses(int buses) { this.buses = buses; }

    public int getBusCount() { return busCount > 0 ? busCount : buses; }
    public void setBusCount(int busCount) { this.busCount = busCount; }

    public int getTrucks() { return trucks > 0 ? trucks : truckCount; }
    public void setTrucks(int trucks) { this.trucks = trucks; }

    public int getTruckCount() { return truckCount > 0 ? truckCount : trucks; }
    public void setTruckCount(int truckCount) { this.truckCount = truckCount; }

    public int getAmbulanceCount() { return ambulanceCount; }
    public void setAmbulanceCount(int ambulanceCount) { this.ambulanceCount = ambulanceCount; }

    public String getDensity() { return density != null ? density : trafficDensity; }
    public void setDensity(String density) { this.density = density; }

    public String getTrafficDensity() { return trafficDensity != null ? trafficDensity : density; }
    public void setTrafficDensity(String trafficDensity) { this.trafficDensity = trafficDensity; }

    public String getCurrentSignal() { return currentSignal; }
    public void setCurrentSignal(String currentSignal) { this.currentSignal = currentSignal; }

    public int getRemainingSignalTime() { return remainingSignalTime; }
    public void setRemainingSignalTime(int remainingSignalTime) { this.remainingSignalTime = remainingSignalTime; }

    public int getGreenTime() { return greenTime > 0 ? greenTime : aiRecommendedGreenTime; }
    public void setGreenTime(int greenTime) { this.greenTime = greenTime; }

    public int getRedTime() { return redTime; }
    public void setRedTime(int redTime) { this.redTime = redTime; }

    public int getAiRecommendedGreenTime() { return aiRecommendedGreenTime > 0 ? aiRecommendedGreenTime : greenTime; }
    public void setAiRecommendedGreenTime(int aiRecommendedGreenTime) { this.aiRecommendedGreenTime = aiRecommendedGreenTime; }

    public int getQueueLength() { return queueLength; }
    public void setQueueLength(int queueLength) { this.queueLength = queueLength; }

    public double getAverageVehicleSpeed() { return averageVehicleSpeed; }
    public void setAverageVehicleSpeed(double averageVehicleSpeed) { this.averageVehicleSpeed = averageVehicleSpeed; }

    public String getEmergencyStatus() { return emergencyStatus; }
    public void setEmergencyStatus(String emergencyStatus) { this.emergencyStatus = emergencyStatus; }

    public double getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(double aiConfidence) { this.aiConfidence = aiConfidence; }
}
