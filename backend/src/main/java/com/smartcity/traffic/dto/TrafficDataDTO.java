package com.smartcity.traffic.dto;

public class TrafficDataDTO {
    private int totalVehicles;
    private int cars;
    private int motorcycles;
    private int buses;
    private int trucks;
    private String density;
    private int greenTime;
    private int redTime;

    public TrafficDataDTO() {}

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

    public String getDensity() { return density; }
    public void setDensity(String density) { this.density = density; }

    public int getGreenTime() { return greenTime; }
    public void setGreenTime(int greenTime) { this.greenTime = greenTime; }

    public int getRedTime() { return redTime; }
    public void setRedTime(int redTime) { this.redTime = redTime; }
}
