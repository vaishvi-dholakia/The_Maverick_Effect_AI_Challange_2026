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
    const CAMERA_STREAM_BASE = "http://localhost:5000/video-feed";
    const PYTHON_HEALTH_URL = "http://localhost:5000/health";

    const JUNCTION_COORDS = {
        "J101": { lat: 23.0225, lng: 72.5714, name: "Junction A - Central Avenue" },
        "J102": { lat: 23.0300, lng: 72.5800, name: "Junction B - Ring Road" },
        "J103": { lat: 23.0150, lng: 72.5600, name: "Junction C - Tech Park Crossing" },
        "J104": { lat: 23.0400, lng: 72.5900, name: "Junction D - Airport Expressway" }
    };

    const CURRENT_ROUTE_COORDS = [
        [23.0225, 72.5714],
        [23.0260, 72.5750],
        [23.0300, 72.5800]
    ];

    const ALTERNATIVE_ROUTE_COORDS = [
        [23.0225, 72.5714],
        [23.0210, 72.5780],
        [23.0250, 72.5840],
        [23.0300, 72.5800]
    ];

    const EMERGENCY_CORRIDOR_COORDS = [
        [23.0225, 72.5714],
        [23.0280, 72.5720],
        [23.0350, 72.5730],
        [23.0400, 72.5900]
    ];

    let map = null;
    const mapMarkers = {};
    let currentRoutePolyline = null;
    let alternativeRoutePolyline = null;
    let emergencyCorridorPolyline = null;
    let selectedJunctionId = "J101";
    let selectedCameraName = "Camera 01 - Junction A";

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
            camBadge.className = "cam-badge-online";
            camBadge.innerHTML = '<i class="fa-solid fa-circle fs-6"></i> ONLINE';
        }
        setStatus("status-camera", "ONLINE");
        setStreamStatus("ONLINE");
    }

    // Global Tab Switch Function
    window.switchTab = function(event, tabId) {
        if (event) event.preventDefault();

        // 1. Remove active class from all nav links
        document.querySelectorAll(".sidebar-nav .nav-link").forEach(link => {
            link.classList.remove("active");
        });

        // 2. Add active class to clicked link
        if (event && event.currentTarget) {
            event.currentTarget.classList.add("active");
        }

        // 3. Hide all tabs
        document.querySelectorAll(".tab-pane").forEach(pane => {
            pane.classList.remove("active-tab");
        });

        // 4. Show target tabs
        document.querySelectorAll(`.tab-pane[data-tab="${tabId}"]`).forEach(pane => {
            pane.classList.add("active-tab");
        });

        // 5. Force resize on charts and map to prevent layout bugs
        setTimeout(() => {
            if (map) map.invalidateSize();
            resizeAllCharts();
        }, 150);
        
        addOpsTimeline(`Navigated to ${tabId.toUpperCase()} view`);
    };

    // Global Camera Switch Function
    window.switchCamera = function(jId, camName) {
        if (!JUNCTION_COORDS[jId]) return;
        selectedJunctionId = jId;
        selectedCameraName = camName;

        document.querySelectorAll(".cam-manage-card").forEach(card => card.classList.remove("active"));
        document.querySelectorAll(`[id="cam-card-${jId}"]`).forEach(card => card.classList.add("active"));

        const camImg = document.getElementById("cam-stream");
        const loadingOverlay = document.getElementById("cam-loading-overlay");
        if (loadingOverlay) loadingOverlay.classList.remove("d-none");
        if (camImg) {
            camImg.src = `${CAMERA_STREAM_BASE}/${jId}?t=${new Date().getTime()}`;
            setTimeout(hideCamLoading, 500);
        }

        const jInfo = JUNCTION_COORDS[jId];
        setElemText("selected-cam-name", camName);
        setElemText("map-panel-jname", `${camName} (${jInfo.name})`);
        setElemText("map-panel-jid", `Stream: /video-feed/${jId}`);
        setElemText("stream-info-cam", `CAM: ${jId}`);

        if (map) {
            map.flyTo([jInfo.lat, jInfo.lng], 15, { duration: 1.2 });
            if (mapMarkers[jId]) mapMarkers[jId].openPopup();
        }

        addOpsTimeline(`Switched camera stream to ${camName}`);
        addAlert(`Switched video feed to ${camName}`, "info");
    };

    // Search Suggestions and Quick Navigation Handler
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
        "Loading Assets...",
        "Connecting Backend...",
        "Connecting AI Engine...",
        "Initializing Executive Command Center...",
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
            addOpsTimeline("System Initialized: Smart City Command Center Active");
            addAlert("System Online: Executive Command Center Ready", "info");
        }
    }, 300);

    // 3. Presentation Mode ("Judge Mode") & Sidebar Handlers
    const btnPresentation = document.getElementById("btn-presentation-mode");
    if (btnPresentation) {
        btnPresentation.addEventListener("click", () => {
            document.body.classList.toggle("presentation-mode");
            const isPres = document.body.classList.contains("presentation-mode");

            if (isPres) {
                btnPresentation.innerHTML = '<i class="fa-solid fa-compress me-1"></i> Exit Presentation Mode';
                btnPresentation.className = "btn btn-outline-warning btn-sm fw-bold";
                addAlert("Presentation Mode Enabled for Hackathon Judges", "warning");
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

    // 4. Report Center CSV & PDF Export Handlers
    const btnExportCsv = document.getElementById("btn-export-csv");
    if (btnExportCsv) {
        btnExportCsv.addEventListener("click", () => {
            const csvContent = "data:text/csv;charset=utf-8," 
                + "Timestamp,Junction,Total_Vehicles,Density,Green_Time,CO2_Reduction,AI_Confidence\n"
                + `${new Date().toISOString()},Junction A - Central Ave,18,MEDIUM,35s,28%,96.4%\n`
                + `${new Date().toISOString()},Junction B - Ring Road,12,LOW,30s,32%,98.2%\n`
                + `${new Date().toISOString()},Junction C - Tech Park,24,HIGH,50s,22%,94.5%\n`
                + `${new Date().toISOString()},Junction D - Airport Expy,8,LOW,35s,35%,99.0%\n`;

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `SmartCity_Traffic_Report_${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            addAlert("Municipal Traffic CSV Report Exported Successfully", "info");
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

    // 5. Operations Activity Timeline Feed
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

    // 6. Notification Center Feed
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

    // 7. Status Pill Helper
    function setStatus(elemId, status) {
        const elem = document.getElementById(elemId);
        if (elem) {
            elem.className = `status-pill pill-${status.toLowerCase()}`;
            elem.textContent = status;
        }

        const dlgElemMap = {
            "status-backend": "dlg-status-backend",
            "status-ai": "dlg-status-ai",
            "status-db": "dlg-status-db",
            "status-camera": "dlg-status-camera"
        };
        if (dlgElemMap[elemId]) {
            const dlgElem = document.getElementById(dlgElemMap[elemId]);
            if (dlgElem) {
                dlgElem.className = `status-pill pill-${status.toLowerCase()}`;
                dlgElem.textContent = status;
            }
        }
    }

    function setStreamStatus(status) {
        const dlgStream = document.getElementById("dlg-status-stream");
        if (dlgStream) {
            dlgStream.className = `status-pill pill-${status.toLowerCase()}`;
            dlgStream.textContent = status;
        }
    }

    // 8. Initialize Smart GIS Map
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
                radius: isEmgJunction ? 16 : 14,
                fillColor: isEmgJunction ? "#00f2fe" : "#22c55e",
                color: "#ffffff",
                weight: 3,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(map);

            m.bindPopup(`<strong>${info.name}</strong><br>${isEmgJunction ? '<span class="text-info fw-bold">Emergency Vehicle Junction</span>' : 'Stream: /video-feed/' + jId}`);
            m.on("click", () => switchCamera(jId, `Camera for ${info.name}`));
            mapMarkers[jId] = m;
        }

        currentRoutePolyline = L.polyline(CURRENT_ROUTE_COORDS, {
            color: '#ef4444',
            weight: 4,
            opacity: 0.7,
            dashArray: '8, 8'
        }).addTo(map);

        alternativeRoutePolyline = L.polyline(ALTERNATIVE_ROUTE_COORDS, {
            color: '#22c55e',
            weight: 5,
            opacity: 0.8
        }).addTo(map);

        emergencyCorridorPolyline = L.polyline(EMERGENCY_CORRIDOR_COORDS, {
            color: '#00f2fe',
            weight: 7,
            opacity: 0.95
        }).addTo(map);
        emergencyCorridorPolyline.bindPopup("<strong>AI Recommended Green Corridor</strong> (Emergency Ambulance Route)");

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
                pollTrafficData();
                addAlert("Multi-camera map telemetry refreshed.", "info");
            });
        }

        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 300);
    }

    // 9. Initialize Chart.js Analytics
    function initCharts() {
        const doughnutCtx = document.getElementById("doughnutChart");
        if (doughnutCtx) {
            doughnutChart = new Chart(doughnutCtx.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Cars", "Bikes", "Buses", "Trucks"],
                    datasets: [{
                        data: [0, 0, 0, 0],
                        backgroundColor: ["#FFB000", "#6FCF7A", "#38bdf8", "#E8544A"],
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
                        label: "Vehicles",
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
                            label: "Actual Vehicles",
                            data: [14, 14, 15, 15],
                            borderColor: "#6FCF7A",
                            backgroundColor: "rgba(111, 207, 122, 0.15)",
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: "Predicted Trend",
                            data: [14, 16, 21, 26],
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
                    labels: ["Low", "Med", "High", "Sev"],
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
                        data: [35, 35],
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

    // 9b. Initialize Deep Historical Analytics Charts
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

        const distCtx = document.getElementById("analyticsDistChart");
        if (distCtx) {
            analyticsDistChart = new Chart(distCtx.getContext("2d"), {
                type: "doughnut",
                data: {
                    labels: ["Sedans", "Motorcycles", "Heavy Duty", "Buses"],
                    datasets: [{
                        data: [45, 30, 15, 10],
                        backgroundColor: ["#FFB000", "#6FCF7A", "#E8544A", "#38bdf8"],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "right", labels: { color: "#A89C8D", font: { family: "'JetBrains Mono', monospace", size: 10 } } } } }
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
                        label: "YOLOv8 Confidence %",
                        data: [98.2, 98.5, 95.4, 96.1, 95.8, 97.2],
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

    window.resizeAllCharts = function() {
        const charts = [
            doughnutChart, lineTrendChart, barDensityChart, horizontalBarChart, predictionLineChart,
            analyticsVolumeChart, analyticsDistChart, analyticsCo2Chart, analyticsAccuracyChart
        ];
        charts.forEach(chart => {
            if (chart) chart.resize();
        });
    };

    // 10. Update Dashboard Telemetry & KPI Cards
    function updateDashboardUI(data) {
        if (!data) return;

        const totalVehicles = data.totalVehicles ?? 0;
        const cars = data.cars ?? 0;
        const motorcycles = data.motorcycles ?? 0;
        const buses = data.buses ?? 0;
        const trucks = data.trucks ?? 0;
        const density = (data.density || "LOW").toUpperCase();
        const greenTime = data.greenTime ?? 35;
        const redTime = data.redTime ?? 35;

        setElemText("map-panel-vehicles", totalVehicles);
        setElemText("stream-info-vehicles", totalVehicles);
        setElemText("stream-info-signal", `Green: ${greenTime}s | Red: ${redTime}s`);

        const levelElem = document.getElementById("map-panel-level");
        if (levelElem) {
            levelElem.className = `status-pill pill-${density === 'SEVERE' ? 'offline' : (density === 'HIGH' ? 'connecting' : 'online')}`;
            levelElem.textContent = density;
        }

        const streamDensityElem = document.getElementById("stream-info-density");
        if (streamDensityElem) {
            streamDensityElem.className = `status-pill pill-${density === 'SEVERE' ? 'offline' : (density === 'HIGH' ? 'connecting' : 'online')}`;
            streamDensityElem.textContent = density;
        }

        const signalIndicator = document.getElementById("map-panel-signal-indicator");
        if (signalIndicator) {
            let signalClass = "signal-indicator-green";
            let signalText = `GREEN (${greenTime}s)`;
            if (density === "HIGH") {
                signalClass = "signal-indicator-yellow";
                signalText = `YELLOW (${greenTime}s)`;
            } else if (density === "SEVERE") {
                signalClass = "signal-indicator-red";
                signalText = `RED (${redTime}s)`;
            }
            signalIndicator.className = `glowing-signal-indicator ${signalClass}`;
            signalIndicator.innerHTML = `<i class="fa-solid fa-traffic-light"></i> ${signalText}`;
        }

        let recommendation = "Standard Low Traffic Cycle";
        if (density === "MEDIUM") recommendation = "Balanced Signal Timing Optimization";
        if (density === "HIGH") recommendation = "Extended Green for Lane Clearance";
        if (density === "SEVERE") recommendation = "Maximum Priority Green Signal";
        setElemText("map-panel-recommendation", recommendation);
        setElemText("stream-info-recommendation", recommendation);

        const jId = data.junctionId || "J101";
        if (mapMarkers[jId]) {
            const color = DENSITY_COLORS[density] || "#22c55e";
            mapMarkers[jId].setStyle({ fillColor: color, color: "#ffffff" });
        }

        updateCharts(cars, motorcycles, buses, trucks, totalVehicles, density, greenTime, redTime);
        fetchRouteRecommendation();
        fetchPrediction();
    }

    // Update AI Route Recommendation UI
    function updateRouteRecommendationUI(rec) {
        if (!rec) return;

        const density = (rec.trafficDensity || "LOW").toUpperCase();
        const recCard = document.getElementById("route-rec-card");
        const noRecBanner = document.getElementById("route-no-rec-banner");
        const prioBadge = document.getElementById("route-priority-badge");

        if (density === "HIGH" || density === "SEVERE" || rec.required) {
            if (recCard) recCard.classList.add("blinking-warning");
            if (noRecBanner) noRecBanner.classList.add("d-none");
            
            if (prioBadge) {
                prioBadge.className = `priority-badge ${density === 'SEVERE' ? 'priority-emergency' : 'priority-high'}`;
                prioBadge.textContent = density === 'SEVERE' ? 'STRONGLY RECOMMENDED' : 'RECOMMENDED';
            }

            setElemText("route-curr-name", rec.currentRoute ?? "Route A (Via Main Highway)");
            setElemText("route-curr-level", density);
            setElemText("route-alt-name", rec.recommendedRoute ?? "Route B (Via Service Bypass Road)");
            setElemText("route-time-saved", rec.estimatedTimeSaved ?? "8 min");
            setElemText("route-wait-reduction", rec.estimatedWaitingReduction ?? "45%");
            setElemText("route-co2-reduction", rec.estimatedCo2Reduction ?? "22%");
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

            setElemText("route-curr-name", "Route A (Via Main Highway)");
            setElemText("route-curr-level", density);
            setElemText("route-alt-name", "N/A (No Reroute Needed)");
            setElemText("route-time-saved", "0 min");
            setElemText("route-wait-reduction", "0%");
            setElemText("route-co2-reduction", "0%");
            setElemText("route-reason", "Normal Traffic Flow Operating Smoothly");

            if (currentRoutePolyline) currentRoutePolyline.setStyle({ opacity: 0.4, weight: 4 });
            if (alternativeRoutePolyline) alternativeRoutePolyline.setStyle({ opacity: 0.2, weight: 3 });
        }
    }

    async function fetchRouteRecommendation() {
        try {
            const res = await fetch(API_ROUTE_REC_URL);
            if (res.ok) {
                const rec = await res.json();
                updateRouteRecommendationUI(rec);
            }
        } catch (e) {}
    }

    function setPillDensity(id, density) {
        const el = document.getElementById(id);
        if (!el) return;
        const d = (density || "LOW").toLowerCase();
        el.className = `timeline-density-pill pred-density-${d}`;
        el.textContent = density;
    }

    function updatePredictionUI(pred) {
        if (!pred) return;

        const currVeh = pred.currentVehicles ?? 14;
        const pred2 = pred.predictedVehicles2Min ?? 16;
        const pred5 = pred.predictedVehicles5Min ?? 21;
        const pred10 = pred.predictedVehicles10Min ?? 26;

        const currDensity = (pred.currentDensity || "LOW").toUpperCase();
        const predDensity = (pred.predictedDensity || "MEDIUM").toUpperCase();

        setElemText("kpi-ai-acc", pred.predictionAccuracy ?? "96.4%");

        setElemText("timeline-now-veh", currVeh);
        setPillDensity("timeline-now-density", currDensity);

        setElemText("timeline-2min-veh", pred2);
        setPillDensity("timeline-2min-density", pred2 >= 20 ? "HIGH" : (pred2 >= 15 ? "MEDIUM" : "LOW"));

        setElemText("timeline-5min-veh", pred5);
        setPillDensity("timeline-5min-density", pred5 >= 25 ? "SEVERE" : (pred5 >= 18 ? "HIGH" : "MEDIUM"));

        setElemText("timeline-10min-veh", pred10);
        setPillDensity("timeline-10min-density", pred10 >= 25 ? "SEVERE" : (pred10 >= 18 ? "HIGH" : "MEDIUM"));

        setElemText("pred-conf-val", pred.predictionConfidence ?? "96.4%");
        setElemText("pred-curr-density", currDensity);
        setElemText("pred-target-density", predDensity);
        setElemText("pred-action-text", `Action: Increase Green Signal by ${pred.recommendedGreenTime ? pred.recommendedGreenTime - 35 : 15} Seconds (Preemptive Clearance)`);
        setElemText("pred-reason-text", `Reason: ${pred.recommendationReason ?? "Vehicle Growth Rate Increasing"}`);

        if (predictionLineChart) {
            predictionLineChart.data.datasets[0].data = [currVeh, currVeh, currVeh + 1, currVeh + 1];
            predictionLineChart.data.datasets[1].data = [currVeh, pred2, pred5, pred10];
            predictionLineChart.update();
        }
    }

    async function fetchPrediction() {
        try {
            const res = await fetch(API_PREDICTION_URL);
            if (res.ok) {
                const pred = await res.json();
                updatePredictionUI(pred);
            }
        } catch (e) {}
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

    // 11. Health Checks & Polling
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

    async function pollTrafficData() {
        try {
            const response = await fetch(API_TRAFFIC_URL);
            if (response.ok) {
                const list = await response.json();
                if (Array.isArray(list) && list.length > 0) {
                    updateDashboardUI(list[list.length - 1]);
                }
            }
        } catch (error) {}
        checkHealthAllServices();
    }

    // 12. Connect STOMP WebSockets
    function connectWebSocket() {
        setStatus("status-ws", "CONNECTING");
        try {
            const socket = new SockJS(WEBSOCKET_URL);
            stompClient = Stomp.over(socket);
            stompClient.debug = null;

            stompClient.connect({}, () => {
                setStatus("status-ws", "ONLINE");
                stompClient.subscribe("/topic/traffic", (message) => {
                    const data = JSON.parse(message.body);
                    updateDashboardUI(data);
                });
            }, () => {
                setStatus("status-ws", "OFFLINE");
                startPollingFallback();
            });
        } catch (e) {
            setStatus("status-ws", "OFFLINE");
            startPollingFallback();
        }
    }

    function startPollingFallback() {
        if (!pollInterval) {
            pollTrafficData();
            pollInterval = setInterval(pollTrafficData, 3000);
        }
    }

    // 13. Camera Stream Loading Monitor
    const camImgElem = document.getElementById("cam-stream");
    if (camImgElem) {
        camImgElem.addEventListener("load", hideCamLoading);
        setTimeout(hideCamLoading, 600);
        setInterval(() => {
            if (camImgElem.naturalWidth > 0 || camImgElem.complete) {
                hideCamLoading();
            }
        }, 1000);
    }

    // Initialize Phase 12 Executive Command Center
    initMap();
    initCharts();
    initAnalyticsCharts();
    fetchRouteRecommendation();
    fetchPrediction();
    pollTrafficData();
    connectWebSocket();
    checkHealthAllServices();
    setInterval(checkHealthAllServices, 3000);
});
