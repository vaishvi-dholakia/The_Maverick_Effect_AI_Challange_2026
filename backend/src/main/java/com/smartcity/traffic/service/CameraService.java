package com.smartcity.traffic.service;

import com.smartcity.traffic.entity.Camera;
import com.smartcity.traffic.repository.CameraRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CameraService {

    private final CameraRepository cameraRepository;

    public CameraService(CameraRepository cameraRepository) {
        this.cameraRepository = cameraRepository;
        initDefaultCameras();
    }

    private void initDefaultCameras() {
        if (cameraRepository.count() < 4) {
            cameraRepository.deleteAll();
            cameraRepository.save(new Camera("Camera 01", "Junction A - Central Avenue", "http://localhost:5000/video-feed/J101", "LIVE"));
            cameraRepository.save(new Camera("Camera 02", "Junction B - Ring Road", "http://localhost:5000/video-feed/J102", "LIVE"));
            cameraRepository.save(new Camera("Camera 03", "Junction C - Tech Park Crossing", "http://localhost:5000/video-feed/J103", "LIVE"));
            cameraRepository.save(new Camera("Camera 04", "Junction D - Airport Expressway", "http://localhost:5000/video-feed/J104", "LIVE"));
        }
    }

    public List<Camera> getAllCameras() {
        return cameraRepository.findAll();
    }

    public Optional<Camera> getCameraById(Long id) {
        return cameraRepository.findById(id);
    }

    public Camera saveCamera(Camera camera) {
        return cameraRepository.save(camera);
    }

    public Optional<Camera> updateCamera(Long id, Camera updatedCamera) {
        return cameraRepository.findById(id).map(existing -> {
            existing.setCameraName(updatedCamera.getCameraName());
            existing.setJunctionName(updatedCamera.getJunctionName());
            existing.setCameraUrl(updatedCamera.getCameraUrl());
            existing.setStatus(updatedCamera.getStatus());
            return cameraRepository.save(existing);
        });
    }

    public boolean deleteCamera(Long id) {
        if (cameraRepository.existsById(id)) {
            cameraRepository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<Camera> getActiveCameras() {
        return cameraRepository.findByStatus("LIVE");
    }
}
