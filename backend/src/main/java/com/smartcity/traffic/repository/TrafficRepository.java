package com.smartcity.traffic.repository;

import com.smartcity.traffic.entity.TrafficData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TrafficRepository extends JpaRepository<TrafficData, Long> {
}
