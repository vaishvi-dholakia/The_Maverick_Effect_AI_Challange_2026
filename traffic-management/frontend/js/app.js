document.addEventListener("DOMContentLoaded", () => {
    const API_HEALTH_URL = "http://localhost:8080/api/health";
    const API_TRAFFIC_URL = "http://localhost:8080/api/traffic/all";
    const API_ANALYTICS_URL = "http://localhost:8080/api/dashboard/analytics";
    const API_CAMERAS_URL = "http://localhost:8080/api/cameras";
    const API_ROUTE_REC_URL = "http://localhost:8080/api/routes/recommendation";
    const API_PREDICTION_URL = "http://localhost:8080/api/prediction";
    const API_EMERGENCY_URL = "http://localhost:8080/api/emergency/status";
    const API_EMERGENCY_HIST_URL = "http://localhost:8080/api/emergency/history";
    const API_EMERGENCY_ACK_URL = "http://localhost:8080/api/emergency/acknowledge";
    const WEBSOCKET_URL = "http://localhost:8080/ws";
    const PYTHON_HEALTH_URL = "http://localhost:5000/health";

    const JUNCTION_COORDS = {
        "J101": { lat: 23.0225, lng: 72.5714, name: "Junction A - City Center" },
        "J102": { lat: 23.0300, lng: 72.5800, name: "Junction B - Railway Station" },
        "J103": { lat: 23.0150, lng: 72.5600, name: "Junction C - Hospital Road" },
        "J104": { lat: 23.0400, lng: 72.5900, name: "Junction D - Highway Junction" }
    };

    const PRIMARY_ROUTE_COORDS = [
        [23.0225, 72.5714], // Junction A (City Center)
        [23.0260, 72.5750],
        [23.0300, 72.5800]  // Junction B (Railway Station)
    ];

    const ALTERNATIVE_ROUTE_COORDS = [
        [23.0225, 72.5714], // Junction A (City Center)
        [23.0150, 72.5600], // Junction C (Hospital Road)
        [23.0400, 72.5900], // Junction D (Highway Junction)
        [23.0300, 72.5800]  // Destination
    ];

    const EMERGENCY_CORRIDOR_COORDS = [
        [23.0225, 72.5714], // Junction A
        [23.0300, 72.5800], // Junction B
        [23.0400, 72.5900]  // Junction D
    ];

    let map = null;
    const mapMarkers = {};
    let currentRoutePolyline = null;
    let alternativeRoutePolyline = null;
    let emergencyCorridorPolyline = null;
    let selectedJunctionId = "J101";
    let selectedCameraName = "Camera 01 - Junction A (City Center)";

    let stompClient = null;
    let pollInterval = null;

    let doughnutChart = null;
    let lineTrendChart = null;
    let barDensityChart = null;
    let horizontalBarChart = null;
    let predictionLineChart = null;

    let analyticsVolumeChart = null;
    let analyticsDistChart = null;
    let analyticsCo2Chart = null;
    let analyticsAccuracyChart = null;

    const trendHistory = [];
    const densityCounts = { LOW: 1, MEDIUM: 1, HIGH: 1, SEVERE: 0 };

    const DENSITY_COLORS = {
        "LOW": "#22c55e",
        "MEDIUM": "#eab308",
        "HIGH": "#f97316",
        "CRITICAL": "#ef4444",
        "SEVERE": "#ef4444"
    };

    function setElemText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }

    function hideCamLoading() {
        const camOverlay = document.getElementById("cam-loading-overlay");
        const camOffline = document.getElementById("cam-offline-overlay");
        const camBadge = document.getElementById("cam-status-badge");
        if (camOverlay) camOverlay.classList.add("d-none");
        if (camOffline) camOffline.classList.add("d-none");
        if (camBadge) {
            camBadge.className = "cam-status-live badge bg-success";
            camBadge.innerHTML = '<i class="fa-solid fa-circle me-1 fs-6"></i> LIVE SIMULATION';
        }
        setStatus("status-camera", "ONLINE");
        setStreamStatus("ONLINE");
    }

    // Global Tab Switch Function
    window.switchTab = function(event, tabId) {
        if (event) event.preventDefault();

        document.querySelectorAll(".sidebar-nav .nav-link").forEach(link => {
            link.classList.remove("active");
        });

        if (event && event.currentTarget) {
            event.currentTarget.classList.add("active");
        }

        document.querySelectorAll(".tab-pane").forEach(pane => {
            pane.classList.remove("active-tab");
        });

        document.querySelectorAll(`.tab-pane[data-tab="${tabId}"]`).forEach(pane => {
            pane.classList.add("active-tab");
        });

        setTimeout(() => {
            if (map) map.invalidateSize();
            resizeAllCharts();
        }, 150);
        
        addOpsTimeline(`Navigated to ${tabId.toUpperCase()} view`);
    };

    // Global Camera / Junction Switch Function
    window.switchCamera = function(jId, camName = null) {
        if (!JUNCTION_COORDS[jId]) return;
        selectedJunctionId = jId;

        const defaultCamNames = {
            "J101": "Camera 01 - Junction A (City Center)",
            "J102": "Camera 02 - Junction B (Railway Station)",
            "J103": "Camera 03 - Junction C (Hospital Road)",
            "J104": "Camera 04 - Junction D (Highway)"
        };

        const resolvedCamName = camName || defaultCamNames[jId] || `Camera (${jId})`;
        selectedCameraName = resolvedCamName;

        document.querySelectorAll(".cam-manage-card").forEach(card => card.classList.remove("active"));
        document.querySelectorAll(`[id="cam-card-${jId}"]`).forEach(card => card.classList.add("active"));

        // Synchronize all dropdown selectors across tabs
        document.querySelectorAll(".junction-select-dropdown").forEach(dropdown => {
            dropdown.value = jId;
        });

        if (window.TrafficSimulation) {
            window.TrafficSimulation.setSelectedJunction(jId);
        }

        const jInfo = JUNCTION_COORDS[jId];
        setElemText("selected-cam-name", resolvedCamName);
        setElemText("map-panel-jname", `${resolvedCamName} (${jInfo.name})`);
        setElemText("map-panel-jid", `Stream: Canvas Simulation (${jId})`);
        setElemText("stream-info-cam", `CAM: ${jId}`);

        if (map) {
            map.flyTo([jInfo.lat, jInfo.lng], 15, { duration: 1.2 });
            if (mapMarkers[jId]) mapMarkers[jId].openPopup();
        }

        // Trigger immediate UI telemetry refresh for newly selected junction
        if (window.TrafficSimulation) {
            const jState = window.TrafficSimulation.getJunctionState(jId);
            if (jState && typeof updateDashboardUI === "function") {
                updateDashboardUI({
                    junctionId: jState.id,
                    totalVehicles: jState.vehicles.length,
                    totalVehiclesPassed: jState.totalVehiclesPassed,
                    cars: jState.carsCount,
                    motorcycles: jState.bikesCount,
                    buses: jState.busesCount,
                    trucks: jState.trucksCount,
                    amb: jState.ambCount,
                    density: jState.density,
                    greenTime: jState.greenTimeNS,
                    redTime: jState.redTimeNS,
                    timer: Math.max(0, Math.round(jState.timer)),
                    signalState: jState.signalState,
                    mode: jState.mode,
                    recommendation: jState.recommendation,
                    reason: jState.reason,
                    confidence: jState.confidence,
                    queueLength: jState.queueLength,
                    avgWaitTime: jState.avgWaitTime,
                    avgSpeed: jState.avgSpeedKmH
                });
            }
        }

        addOpsTimeline(`Switched simulation focus to ${resolvedCamName}`);
        addAlert(`Switched tactical view to ${resolvedCamName}`, "info");
    };

    // Search Suggestions Handler
    const searchInput = document.getElementById("navbar-search-input");
    const searchDropdown = document.getElementById("search-suggestions-dropdown");

    if (searchInput && searchDropdown) {
        searchInput.addEventListener("focus", () => {
            searchDropdown.classList.remove("d-none");
        });

        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();
            searchDropdown.classList.remove("d-none");

            const items = searchDropdown.querySelectorAll(".search-suggestion-item");
            items.forEach(item => {
                const text = item.textContent.toLowerCase();
                if (text.includes(query)) {
                    item.style.display = "flex";
                } else {
                    item.style.display = "none";
                }
            });
        });

        searchDropdown.addEventListener("click", (e) => {
            const item = e.target.closest(".search-suggestion-item");
            if (!item) return;

            const action = item.dataset.action;
            if (action === "cam") {
                const jId = item.dataset.jid;
                const camName = item.dataset.name;
                switchCamera(jId, camName);
                searchInput.value = camName;
            } else if (action === "tab") {
                const tabId = item.dataset.tab;
                switchTab(null, tabId);
                searchInput.value = item.textContent.trim();
            }
            searchDropdown.classList.add("d-none");
        });

        document.addEventListener("click", (e) => {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                searchDropdown.classList.add("d-none");
            }
        });
    }

    // 1. Live Time and Date Clock
    function updateClock() {
        const timeElem = document.getElementById("header-time");
        const dateElem = document.getElementById("header-date");
        const now = new Date();

        if (timeElem) timeElem.textContent = now.toLocaleTimeString();
        if (dateElem) {
            dateElem.textContent = now.toLocaleDateString(undefined, {
                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
            });
        }
    }
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Startup Animation Sequence
    const startupSteps = [
        "Initializing 2D Canvas Engine...",
        "Loading City Junction Topology...",
        "Connecting AI Signal Controller...",
        "Initializing Chief Traffic Command Panel...",
        "System Ready"
    ];
    let stepIdx = 0;
    const stepTextElem = document.getElementById("startup-step-text");

    const startupInterval = setInterval(() => {
        if (stepIdx < startupSteps.length) {
            if (stepTextElem) stepTextElem.textContent = startupSteps[stepIdx];
            stepIdx++;
        } else {
            clearInterval(startupInterval);
            const loadingScreen = document.getElementById("loading-screen");
            if (loadingScreen) {
                loadingScreen.style.opacity = "0";
                setTimeout(() => { loadingScreen.style.display = "none"; }, 500);
            }
            if (map) map.invalidateSize();
            addOpsTimeline("System Initialized: Smart City Intelligent Control Center Active");
            addAlert("System Online: Tactical Command Center Ready", "info");

            // Initialize In-Browser Canvas Traffic Simulation Engine
            if (window.TrafficSimulation) {
                window.TrafficSimulation.initEngine("sim-canvas");
                hideCamLoading();
            }
        }
    }, 250);

    // Chief Traffic Controller Panel Listeners
    const greenSlider = document.getElementById("input-green-slider");
    const redSlider = document.getElementById("input-red-slider");
    const valGreenSlider = document.getElementById("val-green-slider");
    const valRedSlider = document.getElementById("val-red-slider");
    const btnApplyManual = document.getElementById("btn-apply-manual");
    const btnApproveAI = document.getElementById("btn-approve-ai");
    const btnRejectAI = document.getElementById("btn-reject-ai");
    const btnTriggerAmb = document.getElementById("btn-trigger-ambulance");

    const btnIncGreen = document.getElementById("btn-inc-green");
    const btnDecGreen = document.getElementById("btn-dec-green");
    const btnForceRed = document.getElementById("btn-force-red");
    const btnForceGreen = document.getElementById("btn-force-green");
    const btnPauseJ = document.getElementById("btn-pause-j");
    const btnResumeJ = document.getElementById("btn-resume-j");
    const btnRestartJ = document.getElementById("btn-restart-j");

    if (greenSlider && valGreenSlider) {
        greenSlider.addEventListener("input", (e) => {
            valGreenSlider.textContent = `${e.target.value}s`;
        });
    }
    if (redSlider && valRedSlider) {
        redSlider.addEventListener("input", (e) => {
            valRedSlider.textContent = `${e.target.value}s`;
        });
    }
    if (btnApplyManual) {
        btnApplyManual.addEventListener("click", () => {
            const gVal = greenSlider ? greenSlider.value : 35;
            const rVal = redSlider ? redSlider.value : 35;
            if (window.TrafficSimulation) {
                window.TrafficSimulation.setManualSignalTiming(selectedJunctionId, gVal, rVal);
            }
            addAlert(`Manual signal timing applied to ${selectedJunctionId}: Green ${gVal}s, Red ${rVal}s`, "warning");
            addOpsTimeline(`Manual Signal Override applied to ${selectedJunctionId}`);
        });
    }
    if (btnApproveAI) {
        btnApproveAI.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.approveAI(selectedJunctionId);
            addAlert(`AI Signal Timing Approved for ${selectedJunctionId}`, "success");
            addOpsTimeline(`Chief Controller Approved AI Recommendation for ${selectedJunctionId}`);
        });
    }
    if (btnRejectAI) {
        btnRejectAI.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.rejectAI(selectedJunctionId);
            addAlert(`AI Recommendation Rejected for ${selectedJunctionId}`, "danger");
            addOpsTimeline(`Chief Controller Rejected AI Recommendation for ${selectedJunctionId}`);
        });
    }
    if (btnIncGreen) {
        btnIncGreen.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.increaseGreen(selectedJunctionId, 10);
            addAlert(`Increased Green Light Time (+10s) for ${selectedJunctionId}`, "success");
        });
    }
    if (btnDecGreen) {
        btnDecGreen.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.decreaseGreen(selectedJunctionId, 10);
            addAlert(`Decreased Green Light Time (-10s) for ${selectedJunctionId}`, "warning");
        });
    }
    if (btnForceRed) {
        btnForceRed.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.forceRed(selectedJunctionId);
            addAlert(`FORCED RED SIGNAL for ${selectedJunctionId}`, "danger");
            addOpsTimeline(`Forced RED Signal applied to ${selectedJunctionId}`);
        });
    }
    if (btnForceGreen) {
        btnForceGreen.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.forceGreen(selectedJunctionId);
            addAlert(`FORCED GREEN SIGNAL for ${selectedJunctionId}`, "success");
            addOpsTimeline(`Forced GREEN Signal applied to ${selectedJunctionId}`);
        });
    }
    if (btnPauseJ) {
        btnPauseJ.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.pauseJunction(selectedJunctionId);
            addAlert(`PAUSED Simulation for ${selectedJunctionId}`, "warning");
        });
    }
    if (btnResumeJ) {
        btnResumeJ.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.resumeJunction(selectedJunctionId);
            addAlert(`RESUMED Simulation for ${selectedJunctionId}`, "info");
        });
    }
    if (btnRestartJ) {
        btnRestartJ.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.restartJunction(selectedJunctionId);
            addAlert(`RESTARTED Junction Simulation for ${selectedJunctionId}`, "info");
            addOpsTimeline(`Restarted junction state for ${selectedJunctionId}`);
        });
    }
    if (btnTriggerAmb) {
        btnTriggerAmb.addEventListener("click", () => {
            if (window.TrafficSimulation) window.TrafficSimulation.triggerEmergency(selectedJunctionId);
            addAlert(`GREEN WAVE EMERGENCY CORRIDOR ACTIVATED (A -> B -> D)!`, "danger");
            addOpsTimeline(`Emergency Green Wave Corridor Activated`);
        });
    }

    // Real-Time Telemetry Synchronization Loop (500ms)
    setInterval(() => {
        if (!window.TrafficSimulation) return;
        const allJunctions = window.TrafficSimulation.getAllJunctions();
        const activeJunction = window.TrafficSimulation.getJunctionState(selectedJunctionId);
        const emg = window.TrafficSimulation.getEmergencyTelemetry();

        if (activeJunction) {
            updateDashboardUI({
                junctionId: activeJunction.id,
                totalVehicles: activeJunction.currentCount,
                totalVehiclesPassed: activeJunction.totalVehiclesPassed,
                cars: activeJunction.carsCount,
                motorcycles: activeJunction.bikesCount,
                buses: activeJunction.busesCount,
                trucks: activeJunction.trucksCount,
                amb: activeJunction.ambCount,
                density: activeJunction.density,
                greenTime: activeJunction.greenTimeNS,
                redTime: activeJunction.redTimeNS,
                timer: activeJunction.timer,
                signalState: activeJunction.signalState,
                mode: activeJunction.mode,
                recommendation: activeJunction.recommendation,
                reason: activeJunction.reason,
                confidence: activeJunction.confidence,
                queueLength: activeJunction.queueLength,
                avgWaitTime: activeJunction.avgWaitTime,
                avgSpeed: activeJunction.avgSpeedKmH
            });
        }

        // Global Network KPI Aggregator across all 4 live simulation nodes
        let totalNetVehicles = 0;
        let totalNetQueue = 0;
        let totalNetPassed = 0;
        let highCongestionCount = 0;
        let avgConfidenceSum = 0;
        let junctionCount = 0;

        for (const jId in allJunctions) {
            const j = allJunctions[jId];
            totalNetVehicles += j.currentCount || 0;
            totalNetQueue += j.queueLength || 0;
            totalNetPassed += j.totalVehiclesPassed || 0;
            if (j.density === "HIGH" || j.density === "CRITICAL" || j.density === "SEVERE") {
                highCongestionCount++;
            }
            avgConfidenceSum += (j.confidence || 98);
            junctionCount++;
        }

        // Smooth, stable KPI calculations
        const avgNetWait = Math.max(14, Math.min(48, Math.round(18 + (totalNetQueue * 1.8) + (totalNetVehicles * 0.4))));
        const co2SavedPct = Math.max(18, Math.min(42, Math.round(26 + (totalNetPassed % 10) * 0.5)));
        const networkAvgConfidence = junctionCount > 0 ? (avgConfidenceSum / junctionCount).toFixed(1) : "98.2";
        const deadlocksCount = window.TrafficSimulation.getDeadlockEventsCount ? window.TrafficSimulation.getDeadlockEventsCount() : 0;

        const netAvgSpeed = Math.max(22, Math.min(45, Math.round(38 - (totalNetVehicles * 0.35))));
        // Flow Throughput is vehicles processed per minute across 4 junctions (rate between 34 - 64 veh/min)
        const flowThroughput = Math.max(32, Math.min(68, Math.round(34 + (totalNetVehicles * 0.8))));
        // AI Interventions count increments cleanly and remains stable
        const interventionsCount = Math.max(6, 12 + deadlocksCount + Math.floor(totalNetPassed / 12) + (emg && emg.active ? 3 : 0));

        // Update Top Global KPI Grid Dynamically
        setElemText("kpi-connected-cams", "4 / 4");
        setElemText("kpi-interventions", `${interventionsCount} Actions`);
        setElemText("kpi-network-speed", `${netAvgSpeed} km/h`);
        setElemText("kpi-emg-count", `${emg && emg.active ? '1 Active' : '0 Active'}`);
        setElemText("kpi-avg-wait", `${avgNetWait}s`);
        setElemText("kpi-co2-saved", `${co2SavedPct}%`);
        setElemText("kpi-throughput", `${flowThroughput} veh/min`);
        setElemText("kpi-ai-acc", `${networkAvgConfidence}%`);

        // Update GIS Map Markers according to live density across all 4 junctions
        for (const jId in allJunctions) {
            const jState = allJunctions[jId];
            if (mapMarkers[jId]) {
                const color = DENSITY_COLORS[jState.density] || "#22c55e";
                mapMarkers[jId].setStyle({ fillColor: color, color: "#ffffff" });
            }
        }

        // Sync Emergency AI Telemetry Dynamically
        if (emg && emg.active) {
            setElemText("emg-amb-id", emg.ambId);
            setElemText("emg-veh-type", `Ambulance (${emg.ambId}) Active`);
            setElemText("emg-junction", emg.currentJunction);
            setElemText("emg-next-j", emg.nextJunction);
            setElemText("emg-dest", emg.destination);
            setElemText("emg-route", emg.route);
            setElemText("emg-speed", `${emg.speedKmH} km/h`);
            setElemText("emg-dist", `${emg.distanceMeters} m`);
            setElemText("emg-eta", `${emg.etaSeconds} sec`);
            setElemText("emg-gw-status", emg.greenWaveStatus);
            setElemText("emg-clearance", `${emg.laneClearancePercent}%`);
            setElemText("emg-time-saved", `${emg.timeSavedMin} min`);

            if (emergencyCorridorPolyline) {
                emergencyCorridorPolyline.setStyle({
                    opacity: 0.95,
                    weight: 8,
                    color: "#00f2fe"
                });
            }
        } else {
            setElemText("emg-amb-id", "AMB-STANDBY");
            setElemText("emg-veh-type", "No Emergency Priority Request Active");
            setElemText("emg-junction", "Network Monitoring Active");
            setElemText("emg-next-j", "All Corridors Clear");
            setElemText("emg-dest", "General Hospital / Emergency Hub");
            setElemText("emg-route", "Ready for Dynamic Green Wave Dispatch");
            setElemText("emg-speed", "0 km/h");
            setElemText("emg-dist", "0 m");
            setElemText("emg-eta", "0 sec");
            setElemText("emg-gw-status", "STANDBY");
            setElemText("emg-clearance", "100% Ready");
            setElemText("emg-time-saved", "0.0 min");

            if (emergencyCorridorPolyline) {
                emergencyCorridorPolyline.setStyle({
                    opacity: 0.2,
                    weight: 4,
                    color: "#475569"
                });
            }
        }

        // Update Analytics Hub Deep Charts
        updateAnalyticsCharts(totalNetPassed, co2SavedPct, networkAvgConfidence);

        // Inter-Junction Alternate Route Engine Evaluation
        evaluateInterJunctionRerouting(allJunctions);
    }, 500);

    // Inter-Junction Rerouting Engine
    function evaluateInterJunctionRerouting(allJunctions) {
        const jA = allJunctions["J101"];
        const jB = allJunctions["J102"];
        const jC = allJunctions["J103"];
        const jD = allJunctions["J104"];

        if (!jA || !jB) return;

        // Dynamic bypass evaluation based on real queue lengths of J102 vs J103
        const bIsCongested = (jB.density === "HIGH" || jB.density === "CRITICAL" || jB.density === "SEVERE" || jB.queueLength >= 4);

        if (bIsCongested) {
            const timeSaved = Math.round(jB.queueLength * 1.8 + 4);
            const waitReduction = Math.round(Math.min(75, 35 + jB.queueLength * 4));
            const co2Reduction = Math.round(Math.min(45, 18 + jB.queueLength * 2.2));

            updateRouteRecommendationUI({
                trafficDensity: jB.density,
                currentRoute: `Route A (Via ${jB.name})`,
                recommendedRoute: `Route B (Via ${jC ? jC.name : 'J103'} ➔ ${jD ? jD.name : 'J104'})`,
                estimatedTimeSaved: `${timeSaved} min`,
                estimatedWaitingReduction: `${waitReduction}%`,
                estimatedCo2Reduction: `${co2Reduction}%`,
                reason: `Congestion detected at ${jB.id} (${jB.currentCount} vehicles, queue ${jB.queueLength}). Dynamic AI bypass routed via J103 & J104.`,
                priority: "STRONGLY RECOMMENDED",
                required: true
            });
        } else {
            updateRouteRecommendationUI({
                trafficDensity: jB.density,
                currentRoute: `Route A (Via ${jB.name})`,
                recommendedRoute: "Route A (Direct Corridor - No Bypass Required)",
                estimatedTimeSaved: "0 min",
                estimatedWaitingReduction: "0%",
                estimatedCo2Reduction: "0%",
                reason: `Traffic flow across ${jB.id} operating within optimal smooth limits.`,
                priority: "NORMAL",
                required: false
            });
        }
    }

    // Presentation Mode & Sidebar Handlers
    const btnPresentation = document.getElementById("btn-presentation-mode");
    if (btnPresentation) {
        btnPresentation.addEventListener("click", () => {
            document.body.classList.toggle("presentation-mode");
            const isPres = document.body.classList.contains("presentation-mode");

            if (isPres) {
                btnPresentation.innerHTML = '<i class="fa-solid fa-compress me-1"></i> Exit Presentation Mode';
                btnPresentation.className = "btn btn-outline-warning btn-sm fw-bold";
                addAlert("Presentation Mode Enabled", "warning");
                addOpsTimeline("Presentation Mode Enabled");
            } else {
                btnPresentation.innerHTML = '<i class="fa-solid fa-tv me-1"></i> Presentation Mode';
                btnPresentation.className = "btn btn-warning btn-sm fw-bold";
                addAlert("Exited Presentation Mode", "info");
            }

            setTimeout(() => {
                if (map) map.invalidateSize();
                resizeAllCharts();
            }, 300);
        });
    }

    const btnToggleSidebar = document.getElementById("btn-toggle-sidebar");
    if (btnToggleSidebar) {
        btnToggleSidebar.addEventListener("click", () => {
            document.body.classList.toggle("sidebar-collapsed");
            setTimeout(() => {
                if (map) map.invalidateSize();
                resizeAllCharts();
            }, 300);
        });
    }

    function resizeAllCharts() {
        if (doughnutChart) doughnutChart.resize();
        if (lineTrendChart) lineTrendChart.resize();
        if (barDensityChart) barDensityChart.resize();
        if (horizontalBarChart) horizontalBarChart.resize();
        if (predictionLineChart) predictionLineChart.resize();
    }

    // Report CSV & PDF Export Handlers
    const btnExportCsv = document.getElementById("btn-export-csv");
    if (btnExportCsv) {
        btnExportCsv.addEventListener("click", () => {
            const allJ = window.TrafficSimulation ? window.TrafficSimulation.getAllJunctions() : {};
            let csvLines = "Timestamp,Junction_ID,Junction_Name,Vehicles_Active,Vehicles_Passed,Queue_Length,Density,Signal_State,Green_Time_s\n";
            for (const id in allJ) {
                const j = allJ[id];
                csvLines += `${new Date().toISOString()},${j.id},"${j.name}",${j.currentCount},${j.totalVehiclesPassed},${j.queueLength},${j.density},${j.signalState},${j.greenTimeNS}\n`;
            }

            const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvLines);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `SmartCity_Traffic_Report_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            addAlert("Municipal Traffic CSV Report Exported", "info");
            addOpsTimeline("CSV Report Exported");
        });
    }

    const btnExportPdf = document.getElementById("btn-export-pdf");
    if (btnExportPdf) {
        btnExportPdf.addEventListener("click", () => {
            addAlert("Generating PDF Summary Report for Municipal Audit...", "info");
            addOpsTimeline("PDF Summary Report Exported");
            window.print();
        });
    }

    function addOpsTimeline(activity) {
        const container = document.getElementById("ops-timeline-feed");
        if (!container) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const item = document.createElement("div");
        item.className = "alert-item";
        item.innerHTML = `
            <span><i class="fa-solid fa-check-circle text-success me-2"></i> ${activity}</span>
            <small class="text-muted-custom">${timeStr}</small>
        `;

        container.insertBefore(item, container.firstChild);
        if (container.children.length > 15) {
            container.removeChild(container.lastChild);
        }
    }

    function addAlert(message, type = "info") {
        const container = document.getElementById("alerts-feed-list");
        if (!container) return;

        const timeStr = new Date().toLocaleTimeString();
        const alertItem = document.createElement("div");
        alertItem.className = `alert-item ${type}`;

        let icon = "fa-info-circle text-info";
        if (type === "severe") icon = "fa-triangle-exclamation text-danger";
        if (type === "warning") icon = "fa-circle-exclamation text-warning";

        alertItem.innerHTML = `
            <span><i class="fa-solid ${icon} me-2"></i> ${message}</span>
            <small class="text-muted-custom">${timeStr}</small>
        `;

        container.insertBefore(alertItem, container.firstChild);
        if (container.children.length > 20) {
            container.removeChild(container.lastChild);
        }
    }

    function setStatus(elemId, status) {
        const elem = document.getElementById(elemId);
        if (elem) {
            elem.className = `status-pill pill-${status.toLowerCase()}`;
            elem.textContent = status;
        }
    }

    function setStreamStatus(status) {
        const dlgStream = document.getElementById("dlg-status-stream");
        if (dlgStream) {
            dlgStream.className = `status-pill pill-${status.toLowerCase()}`;
            dlgStream.textContent = status;
        }
    }

    // Initialize GIS Map with 4 Junction Markers
    function initMap() {
        const mapContainer = document.getElementById("map");
        if (!mapContainer) return;

        map = L.map("map", { zoomControl: false }).setView([23.0275, 72.5750], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        for (const [jId, info] of Object.entries(JUNCTION_COORDS)) {
            const isEmgJunction = (jId === "J101");
            const m = L.circleMarker([info.lat, info.lng], {
                radius: 15,
                fillColor: "#22c55e",
                color: "#ffffff",
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(map);

            m.bindPopup(`<strong>${info.name}</strong><br><span class="text-warning">Click marker to switch simulation</span>`);
            m.on("click", () => switchCamera(jId, info.name));
            mapMarkers[jId] = m;
        }

        currentRoutePolyline = L.polyline(PRIMARY_ROUTE_COORDS, {
            color: '#ef4444',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 8'
        }).addTo(map);

        alternativeRoutePolyline = L.polyline(ALTERNATIVE_ROUTE_COORDS, {
            color: '#22c55e',
            weight: 5,
            opacity: 0.85
        }).addTo(map);

        emergencyCorridorPolyline = L.polyline(EMERGENCY_CORRIDOR_COORDS, {
            color: '#00f2fe',
            weight: 6,
            opacity: 0.9
        }).addTo(map);

        const btnLocate = document.getElementById("btn-map-locate");
        const btnFullscreen = document.getElementById("btn-map-fullscreen");
        const btnRefresh = document.getElementById("btn-map-refresh");

        if (btnLocate) btnLocate.addEventListener("click", () => map.setView([23.0275, 72.5750], 13));
        if (btnFullscreen) {
            btnFullscreen.addEventListener("click", () => {
                const mapCard = document.getElementById("map").parentElement;
                if (!document.fullscreenElement) {
                    if (mapCard.requestFullscreen) mapCard.requestFullscreen();
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                }
            });
        }
        if (btnRefresh) {
            btnRefresh.addEventListener("click", () => {
                addAlert("GIS Map telemetry refreshed.", "info");
            });
        }

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);
    }

    // Chart.js Setup
    function initCharts() {
        const doughnutCtx = document.getElementById("doughnutChart");
        if (doughnutCtx) {
            doughnutChart = new Chart(doughnutCtx.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Cars", "Bikes", "Buses", "Trucks"],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ["#3b82f6", "#ef4444", "#eab308", "#22c55e"],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "bottom", labels: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } } }
                    }
                }
            });
        }

        const lineCtx = document.getElementById("lineTrendChart");
        if (lineCtx) {
            lineTrendChart = new Chart(lineCtx.getContext("2d"), {
                type: "line",
                data: {
                    labels: [],
                    datasets: [{
                        label: "Active Vehicles",
                        data: [],
                        borderColor: "#FFB000",
                        backgroundColor: "rgba(255, 176, 0, 0.15)",
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 9 } }, grid: { color: "rgba(255, 176, 0, 0.08)" } },
                        y: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 9 } }, grid: { color: "rgba(255, 176, 0, 0.08)" }, beginAtZero: true }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        const predLineCtx = document.getElementById("predictionLineChart");
        if (predLineCtx) {
            predictionLineChart = new Chart(predLineCtx.getContext("2d"), {
                type: "line",
                data: {
                    labels: ["Now", "2 Min", "5 Min", "10 Min"],
                    datasets: [
                        {
                            label: "Actual Count",
                            data: [12, 14, 15, 15],
                            borderColor: "#6FCF7A",
                            backgroundColor: "rgba(111, 207, 122, 0.15)",
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: "AI Prediction Trend",
                            data: [12, 16, 22, 28],
                            borderColor: "#FFB000",
                            borderDash: [5, 5],
                            fill: false,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { color: "rgba(255, 176, 0, 0.08)" } },
                        y: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { color: "rgba(255, 176, 0, 0.08)" }, beginAtZero: true }
                    },
                    plugins: {
                        legend: { position: "top", labels: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } } }
                    }
                }
            });
        }

        const barCtx = document.getElementById("barDensityChart");
        if (barCtx) {
            barDensityChart = new Chart(barCtx.getContext("2d"), {
                type: "bar",
                data: {
                    labels: ["Low", "Med", "High", "Crit"],
                    datasets: [{
                        label: "Events",
                        data: [1, 0, 0, 0],
                        backgroundColor: ["#6FCF7A", "#FFB000", "#f97316", "#E8544A"],
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 9 } }, grid: { display: false } },
                        y: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 9 } }, grid: { color: "rgba(255, 176, 0, 0.08)" }, beginAtZero: true }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        const horizCtx = document.getElementById("horizontalBarChart");
        if (horizCtx) {
            horizontalBarChart = new Chart(horizCtx.getContext("2d"), {
                type: "bar",
                data: {
                    labels: ["Green", "Red"],
                    datasets: [{
                        label: "Seconds",
                        data: [40, 30],
                        backgroundColor: ["#6FCF7A", "#E8544A"],
                        borderRadius: 4
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 9 } }, grid: { color: "rgba(255, 176, 0, 0.08)" }, beginAtZero: true },
                        y: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 9 } }, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    }

    function updateAnalyticsCharts(totalPassed, co2SavedPct, confidence) {
        if (analyticsVolumeChart) {
            const todayIndex = (new Date().getDay() + 6) % 7;
            analyticsVolumeChart.data.datasets[0].data[todayIndex] = 14200 + (totalPassed * 3);
            analyticsVolumeChart.update('none');
        }
        if (analyticsCo2Chart) {
            analyticsCo2Chart.data.datasets[0].data[3] = Math.round(720 + co2SavedPct * 4);
            analyticsCo2Chart.update('none');
        }
        if (analyticsAccuracyChart) {
            analyticsAccuracyChart.data.datasets[0].data[5] = Number(confidence);
            analyticsAccuracyChart.update('none');
        }
    }

    function initAnalyticsCharts() {
        const volCtx = document.getElementById("analyticsVolumeChart");
        if (volCtx) {
            analyticsVolumeChart = new Chart(volCtx.getContext("2d"), {
                type: "bar",
                data: {
                    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                    datasets: [{
                        label: "Vehicles Processed",
                        data: [14200, 15300, 14900, 16100, 17200, 11500, 9800],
                        backgroundColor: "#38bdf8",
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { display: false } }, y: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { color: "rgba(255, 176, 0, 0.08)" } } } }
            });
        }

        const co2Ctx = document.getElementById("analyticsCo2Chart");
        if (co2Ctx) {
            analyticsCo2Chart = new Chart(co2Ctx.getContext("2d"), {
                type: "line",
                data: {
                    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                    datasets: [{
                        label: "CO2 Saved (kg)",
                        data: [450, 580, 720, 890],
                        borderColor: "#6FCF7A",
                        backgroundColor: "rgba(111, 207, 122, 0.15)",
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { display: false } }, y: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { color: "rgba(255, 176, 0, 0.08)" } } } }
            });
        }

        const accCtx = document.getElementById("analyticsAccuracyChart");
        if (accCtx) {
            analyticsAccuracyChart = new Chart(accCtx.getContext("2d"), {
                type: "line",
                data: {
                    labels: ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"],
                    datasets: [{
                        label: "AI Confidence %",
                        data: [98.2, 98.5, 96.4, 97.1, 96.8, 98.2],
                        borderColor: "#FFB000",
                        backgroundColor: "rgba(255, 176, 0, 0.1)",
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { display: false } }, y: { ticks: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } }, grid: { color: "rgba(255, 176, 0, 0.08)" } } } }
            });
        }
    }

    // Update Dashboard UI elements from active junction state
    function updateDashboardUI(data) {
        if (!data) return;

        const totalVehicles = data.totalVehicles ?? 0;
        const totalPassed = data.totalVehiclesPassed ?? 0;
        const cars = data.cars ?? 0;
        const motorcycles = data.motorcycles ?? 0;
        const buses = data.buses ?? 0;
        const trucks = data.trucks ?? 0;
        const amb = data.amb ?? 0;
        const density = (data.density || "LOW").toUpperCase();
        const greenTime = data.greenTime ?? 40;
        const redTime = data.redTime ?? 30;
        const timer = Math.ceil(data.timer ?? 40);
        const signalState = data.signalState || "NS_GREEN";
        const mode = data.mode || "AI_AUTO";
        const recommendation = data.recommendation || "Standard AI Traffic Cycle";
        const reason = data.reason || "Optimal flow across all approaches.";
        const confidence = data.confidence || 98;
        const queueLength = data.queueLength || 0;
        const avgWait = data.avgWaitTime || 0;

        setElemText("map-panel-vehicles", totalVehicles);
        setElemText("stream-info-vehicles", totalVehicles);
        setElemText("stream-info-signal", `Green: ${greenTime}s | Red: ${redTime}s | Countdown: ${timer}s`);

        setElemText("rec-decision", recommendation);
        setElemText("rec-reason", `Reason: ${reason}`);
        setElemText("rec-confidence-val", `${confidence}%`);

        // Autonomous AI Brain Decision Panel update
        setElemText("ai-dec-curr-veh", totalVehicles);
        setElemText("ai-dec-queue", `${queueLength} Vehicles`);
        setElemText("ai-dec-wait", `${avgWait} Sec`);
        setElemText("ai-dec-density", density);
        setElemText("ai-dec-curr-signal", signalState.replace("_", " "));
        setElemText("ai-dec-remaining-time", `${timer} Sec`);
        setElemText("ai-dec-next-signal", signalState.includes("NS") ? `EW GREEN (${redTime}s)` : `NS GREEN (${greenTime}s)`);
        setElemText("ai-dec-conf", `${confidence}%`);
        setElemText("ai-dec-reason", reason);
        setElemText("ai-dec-type-dist", `Cars: ${cars} | Bikes: ${motorcycles} | Buses: ${buses} | Trucks: ${trucks} | Amb: ${amb}`);

        const levelElem = document.getElementById("map-panel-level");
        if (levelElem) {
            levelElem.className = `status-pill pill-${(density === 'CRITICAL' || density === 'SEVERE') ? 'offline' : (density === 'HIGH' ? 'connecting' : 'online')}`;
            levelElem.textContent = density;
        }

        const streamDensityElem = document.getElementById("stream-info-density");
        if (streamDensityElem) {
            streamDensityElem.className = `status-pill pill-${(density === 'CRITICAL' || density === 'SEVERE') ? 'offline' : (density === 'HIGH' ? 'connecting' : 'online')}`;
            streamDensityElem.textContent = density;
        }

        const signalIndicator = document.getElementById("map-panel-signal-indicator");
        if (signalIndicator) {
            let signalClass = "signal-indicator-green";
            let signalText = `GREEN (${timer}s)`;
            if (signalState.includes("YELLOW")) {
                signalClass = "signal-indicator-yellow";
                signalText = `YELLOW (${timer}s)`;
            } else if (signalState.includes("RED") || signalState === "EW_GREEN") {
                signalClass = "signal-indicator-red";
                signalText = `RED (${timer}s)`;
            }
            signalIndicator.className = `glowing-signal-indicator ${signalClass}`;
            signalIndicator.innerHTML = `<i class="fa-solid fa-traffic-light"></i> ${signalText}`;
        }

        setElemText("map-panel-recommendation", recommendation);
        setElemText("stream-info-recommendation", recommendation);

        const jId = data.junctionId || "J101";
        if (mapMarkers[jId]) {
            const color = DENSITY_COLORS[density] || "#22c55e";
            mapMarkers[jId].setStyle({ fillColor: color, color: "#ffffff" });
        }

        updateCharts(cars, motorcycles, buses, trucks, totalVehicles, density, greenTime, redTime);
        updatePredictionUI(data);
    }

    function updatePredictionUI(data) {
        if (!data) return;

        const currentCount = data.totalVehicles || 12;
        const density = (data.density || "LOW").toUpperCase();
        const junctionId = data.junctionId || selectedJunctionId || "J101";

        // Dynamic Growth Multiplier based on current vehicle count and density level
        let growthRate = 1.08;
        if (density === "MEDIUM") growthRate = 1.20;
        else if (density === "HIGH") growthRate = 1.38;
        else if (density === "SEVERE" || density === "CRITICAL") growthRate = 1.60;

        const vehNow = currentCount;
        const veh2min = Math.round(currentCount * (1 + (growthRate - 1) * 0.45));
        const veh5min = Math.round(currentCount * (1 + (growthRate - 1) * 0.95));
        const veh10min = Math.round(currentCount * (1 + (growthRate - 1) * 1.65));

        const getDensityMeta = (count) => {
            if (count > 22) return { text: "SEVERE", color: "#ef4444" };
            if (count > 16) return { text: "HIGH", color: "#f97316" };
            if (count > 10) return { text: "MEDIUM", color: "#eab308" };
            return { text: "LOW", color: "#22c55e" };
        };

        const dNow = getDensityMeta(vehNow);
        const d2m = getDensityMeta(veh2min);
        const d5m = getDensityMeta(veh5min);
        const d10m = getDensityMeta(veh10min);

        setElemText("timeline-now-veh", vehNow);
        setElemText("timeline-2min-veh", veh2min);
        setElemText("timeline-5min-veh", veh5min);
        setElemText("timeline-10min-veh", veh10min);

        setPillDensity("timeline-now-density", dNow.text);
        setPillDensity("timeline-2min-density", d2m.text);
        setPillDensity("timeline-5min-density", d5m.text);
        setPillDensity("timeline-10min-density", d10m.text);

        setElemText("pred-curr-density", dNow.text);
        setElemText("pred-target-density", d5m.text);

        const isHighCongestion = veh5min > 16;
        const actionMsg = isHighCongestion
            ? `Action: Increase Green Signal at ${junctionId} by 15 Seconds (Preemptive Clearance)`
            : `Action: Maintain Dynamic Proportional Allocation for ${junctionId}`;
        setElemText("pred-action-text", actionMsg);

        const reasonMsg = isHighCongestion
            ? `Reason: Forecasted influx reaches ${veh5min} vehicles within +5 min horizon (${d5m.text} Density Risk). Preemptively clears congestion.`
            : `Reason: Traffic volume at ${junctionId} is within optimal smooth parameters.`;
        setElemText("pred-reason-text", reasonMsg);

        // Update Prediction Trend Chart
        if (predictionLineChart) {
            predictionLineChart.data.datasets[0].data = [vehNow, Math.max(1, veh2min - 2), Math.max(2, veh5min - 3), Math.max(3, veh10min - 5)];
            predictionLineChart.data.datasets[1].data = [vehNow, veh2min, veh5min, veh10min];
            predictionLineChart.update();
        }

        // Before vs After AI Benchmark Telemetry
        const beforeWait = Math.round(vehNow * 5.4 + 28);
        const afterWait = Math.round(vehNow * 1.6 + 8);
        const savedWaitPct = Math.round(((beforeWait - afterWait) / beforeWait) * 100);

        const beforeQueue = Math.round(vehNow * 1.25);
        const afterQueue = Math.max(1, Math.round(vehNow * 0.22));
        const savedQueuePct = Math.round(((beforeQueue - afterQueue) / beforeQueue) * 100);

        const beforeRisk = Math.min(98, Math.round(veh5min * 3.9));
        const afterRisk = Math.round(beforeRisk * 0.16);
        const savedRiskPct = Math.round(((beforeRisk - afterRisk) / beforeRisk) * 100);

        setElemText("cmp-before-wait", `${beforeWait}s`);
        setElemText("cmp-after-wait", `${afterWait}s`);
        setElemText("cmp-saved-wait", `-${savedWaitPct}% Saved`);

        setElemText("cmp-before-queue", `${beforeQueue} cars`);
        setElemText("cmp-after-queue", `${afterQueue} cars`);
        setElemText("cmp-saved-queue", `-${savedQueuePct}% Reduced`);

        setElemText("cmp-before-risk", `${beforeRisk}% Risk`);
        setElemText("cmp-after-risk", `${afterRisk}% Risk`);
        setElemText("cmp-saved-risk", `-${savedRiskPct}% Mitigated`);

        // Insights Telemetry
        const liveConfidence = data.confidence ? `${Number(data.confidence).toFixed(1)}%` : `${(94.2 + (vehNow % 5) * 1.1).toFixed(1)}%`;
        setElemText("pred-conf-val", liveConfidence);
        setElemText("ins-confidence", liveConfidence);
        setElemText("ins-risk", `${beforeRisk} / 100`);
        setElemText("ins-congestion", `${Math.min(100, Math.round((vehNow / 24) * 100))}%`);
        setElemText("ins-pred-wait", `${afterWait} sec`);
        setElemText("ins-pred-density", d5m.text);
        setElemText("ins-efficiency", `${100 - afterRisk}%`);
    }

    function updateRouteRecommendationUI(rec) {
        if (!rec) return;

        const density = (rec.trafficDensity || "LOW").toUpperCase();
        const recCard = document.getElementById("route-rec-card");
        const noRecBanner = document.getElementById("route-no-rec-banner");
        const prioBadge = document.getElementById("route-priority-badge");

        if (rec.required) {
            if (recCard) recCard.classList.add("blinking-warning");
            if (noRecBanner) noRecBanner.classList.add("d-none");
            
            if (prioBadge) {
                prioBadge.className = `priority-badge ${density === 'CRITICAL' || density === 'SEVERE' ? 'priority-emergency' : 'priority-high'}`;
                prioBadge.textContent = 'STRONGLY RECOMMENDED';
            }

            setElemText("route-curr-name", rec.currentRoute ?? "Route A (Via Junction B)");
            setElemText("route-curr-level", density);
            setElemText("route-alt-name", rec.recommendedRoute ?? "Route B (Via Junction C & D)");
            setElemText("route-time-saved", rec.estimatedTimeSaved ?? "11 min");
            setElemText("route-wait-reduction", rec.estimatedWaitingReduction ?? "52%");
            setElemText("route-co2-reduction", rec.estimatedCo2Reduction ?? "28%");
            setElemText("route-reason", rec.reason ?? "High Congestion Detected");

            if (currentRoutePolyline) currentRoutePolyline.setStyle({ opacity: 0.9, weight: 6 });
            if (alternativeRoutePolyline) alternativeRoutePolyline.setStyle({ opacity: 0.9, weight: 6 });
        } else {
            if (recCard) recCard.classList.remove("blinking-warning");
            if (noRecBanner) noRecBanner.classList.remove("d-none");

            if (prioBadge) {
                prioBadge.className = "priority-badge priority-medium";
                prioBadge.textContent = "Normal Traffic";
            }

            setElemText("route-curr-name", "Route A (Via Junction B)");
            setElemText("route-curr-level", density);
            setElemText("route-alt-name", "N/A (No Bypass Needed)");
            setElemText("route-time-saved", "0 min");
            setElemText("route-wait-reduction", "0%");
            setElemText("route-co2-reduction", "0%");
            setElemText("route-reason", "Normal Traffic Flow Operating Smoothly");

            if (currentRoutePolyline) currentRoutePolyline.setStyle({ opacity: 0.4, weight: 4 });
            if (alternativeRoutePolyline) alternativeRoutePolyline.setStyle({ opacity: 0.2, weight: 3 });
        }
    }

    function setPillDensity(id, density) {
        const el = document.getElementById(id);
        if (!el) return;
        const d = (density || "LOW").toLowerCase();
        el.className = `timeline-density-pill pred-density-${d}`;
        el.textContent = density;
    }

    function updateCharts(cars, motorcycles, buses, trucks, totalVehicles, density, greenTime, redTime) {
        if (doughnutChart) {
            doughnutChart.data.datasets[0].data = [cars, motorcycles, buses, trucks];
            doughnutChart.update();
        }
        if (lineTrendChart) {
            const timeStr = new Date().toLocaleTimeString();
            trendHistory.push({ time: timeStr, count: totalVehicles });
            if (trendHistory.length > 8) trendHistory.shift();
            lineTrendChart.data.labels = trendHistory.map(item => item.time);
            lineTrendChart.data.datasets[0].data = trendHistory.map(item => item.count);
            lineTrendChart.update();
        }
        if (barDensityChart && densityCounts.hasOwnProperty(density)) {
            densityCounts[density]++;
            barDensityChart.data.datasets[0].data = [
                densityCounts.LOW, densityCounts.MEDIUM, densityCounts.HIGH, densityCounts.SEVERE
            ];
            barDensityChart.update();
        }
        if (horizontalBarChart) {
            horizontalBarChart.data.datasets[0].data = [greenTime, redTime];
            horizontalBarChart.update();
        }
    }

    // Preemptive Signal Boost Button Listener
    const boostBtn = document.getElementById("btn-apply-preemptive-boost");
    if (boostBtn) {
        boostBtn.addEventListener("click", () => {
            if (window.TrafficSimulation && window.TrafficSimulation.applySignalBoost) {
                window.TrafficSimulation.applySignalBoost(15);
                addAlert(`Preemptive AI Signal Boost (+15s) applied to ${selectedJunctionId}!`, "success");
                addOpsTimeline(`Preemptive AI Boost (+15s) triggered for ${selectedJunctionId}`);
            }
        });
    }

    // Health Checks
    async function checkHealthAllServices() {
        try {
            const res = await fetch(API_HEALTH_URL);
            if (res.ok) {
                setStatus("status-backend", "ONLINE");
                setStatus("status-db", "ONLINE");
            } else {
                setStatus("status-backend", "OFFLINE");
                setStatus("status-db", "OFFLINE");
            }
        } catch (e) {
            setStatus("status-backend", "OFFLINE");
            setStatus("status-db", "OFFLINE");
        }

        try {
            const res = await fetch(PYTHON_HEALTH_URL);
            if (res.ok) {
                setStatus("status-ai", "ONLINE");
            } else {
                setStatus("status-ai", "OFFLINE");
            }
        } catch (e) {
            setStatus("status-ai", "OFFLINE");
        }
    }

    // Initialize Command Center Application
    initMap();
    initCharts();
    initAnalyticsCharts();
    checkHealthAllServices();
    setInterval(checkHealthAllServices, 3000);
});
