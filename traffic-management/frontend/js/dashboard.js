const API_TRAFFIC_URL = "http://localhost:8080/api/traffic/all";
const API_ROUTES_URL = "http://localhost:8080/api/routes";
const API_ANALYTICS_URL = "http://localhost:8080/api/dashboard/analytics";
const WEBSOCKET_URL = "http://localhost:8080/ws";

const JUNCTION_LAT = 23.0225;
const JUNCTION_LNG = 72.5714;

let map;
let marker;
let routePolylines = [];

let pieChart;
let lineChart;
const trendHistory = [];
let stompClient = null;

const DENSITY_COLORS = {
    "Low": "#22c55e",
    "Medium": "#eab308",
    "High": "#f97316",
    "Severe": "#ef4444"
};

const ROUTE_COORDINATES = {
    1: [[23.0225, 72.5714], [23.0300, 72.5800], [23.0350, 72.5900]],
    2: [[23.0225, 72.5714], [23.0180, 72.5650], [23.0120, 72.5580], [23.0350, 72.5900]],
    3: [[23.0225, 72.5714], [23.0250, 72.5600], [23.0350, 72.5900]]
};

function updateClock() {
    const timeElem = document.getElementById("clock");
    if (timeElem) {
        timeElem.textContent = new Date().toLocaleTimeString();
    }
}

function showToast(message, isSevere = false) {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${isSevere ? 'toast-severe' : ''}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function initMap() {
    map = L.map("map").setView([JUNCTION_LAT, JUNCTION_LNG], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    marker = L.circleMarker([JUNCTION_LAT, JUNCTION_LNG], {
        radius: 14,
        fillColor: "#22c55e",
        color: "#ffffff",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.85
    }).addTo(map);

    marker.bindPopup("Loading Junction Data...");
}

function initCharts() {
    const pieCtx = document.getElementById("pieChart").getContext("2d");
    pieChart = new Chart(pieCtx, {
        type: "pie",
        data: {
            labels: ["Cars", "Motorcycles", "Buses", "Trucks"],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ["#38bdf8", "#eab308", "#22c55e", "#ef4444"]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: "bottom", labels: { color: "#f8fafc" } } }
        }
    });

    const lineCtx = document.getElementById("lineChart").getContext("2d");
    lineChart = new Chart(lineCtx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Vehicle Count",
                data: [],
                borderColor: "#38bdf8",
                backgroundColor: "rgba(56, 189, 248, 0.15)",
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
                y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" }, beginAtZero: true }
            },
            plugins: { legend: { labels: { color: "#f8fafc" } } }
        }
    });
}

function connectWebSocket() {
    const socket = new SockJS(WEBSOCKET_URL);
    stompClient = Stomp.over(socket);
    stompClient.debug = null; // Disable verbose console logs

    stompClient.connect({}, (frame) => {
        console.log("Connected to STOMP WebSocket server");
        showToast("Connected to Real-time Stream");

        // Subscribe to /topic/traffic
        stompClient.subscribe("/topic/traffic", (message) => {
            const data = JSON.parse(message.body);
            handleRealtimeTrafficUpdate(data);
        });
    }, (error) => {
        console.error("STOMP Connection error:", error);
        setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
    });
}

function handleRealtimeTrafficUpdate(data) {
    renderDashboard(data);
    updateMapMarker(data);
    updateTrendChart(data);
    fetchAnalytics();
    fetchRoutesData();

    if (data.density === "Severe") {
        showToast("High Traffic Alert", true);
    } else {
        showToast("Traffic Updated Successfully");
    }
}

async function fetchLatestTrafficData() {
    try {
        const response = await fetch(API_TRAFFIC_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const dataList = await response.json();

        if (Array.isArray(dataList) && dataList.length > 0) {
            const latest = dataList[dataList.length - 1];
            renderDashboard(latest);
            updateMapMarker(latest);
            updateTrendChart(latest);
        }
    } catch (error) {
        console.error("Error fetching initial traffic data:", error);
    }
}

async function fetchAnalytics() {
    try {
        const response = await fetch(API_ANALYTICS_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const analytics = await response.json();

        if (analytics) {
            document.getElementById("kpi-wait-before").textContent = (analytics.averageWaitingBefore ?? 120) + " sec";
            document.getElementById("kpi-wait-after").textContent = (analytics.averageWaitingAfter ?? 70) + " sec";
            document.getElementById("kpi-co2").textContent = analytics.co2Reduction ?? "18%";

            if (pieChart) {
                pieChart.data.datasets[0].data = [
                    analytics.cars ?? 0,
                    analytics.motorcycles ?? 0,
                    analytics.buses ?? 0,
                    analytics.trucks ?? 0
                ];
                pieChart.update();
            }
        }
    } catch (error) {
        console.error("Error fetching analytics:", error);
    }
}

async function fetchRoutesData() {
    try {
        const response = await fetch(API_ROUTES_URL);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        const routes = await response.json();

        if (Array.isArray(routes)) {
            renderRoutesPanel(routes);
            renderRoutePolylines(routes);
        }
    } catch (error) {
        console.error("Error fetching routes data:", error);
    }
}

function renderDashboard(data) {
    document.getElementById("val-total").textContent = data.totalVehicles ?? 0;
    document.getElementById("val-cars").textContent = data.cars ?? 0;
    document.getElementById("val-motorcycles").textContent = data.motorcycles ?? 0;
    document.getElementById("val-buses").textContent = data.buses ?? 0;
    document.getElementById("val-trucks").textContent = data.trucks ?? 0;

    const densityElem = document.getElementById("val-density");
    const density = data.density || "Unknown";
    densityElem.textContent = density;
    densityElem.className = `card-value status-badge density-${density.toLowerCase()}`;

    document.getElementById("val-green-time").textContent = (data.greenTime ?? 0) + " sec";
    document.getElementById("val-red-time").textContent = (data.redTime ?? 0) + " sec";

    const timestamp = data.createdAt ? new Date(data.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString();
    document.getElementById("val-last-updated").textContent = timestamp;
}

function updateMapMarker(data) {
    if (!marker) return;

    const density = data.density || "Low";
    const color = DENSITY_COLORS[density] || "#94a3b8";
    const timestamp = data.createdAt ? new Date(data.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString();

    marker.setStyle({ fillColor: color, color: "#ffffff" });

    const popupHTML = `
        <div class="popup-content">
            <div class="popup-title">Traffic Junction 1</div>
            <div><strong>Density:</strong> <span style="color: ${color}; font-weight: bold;">${density}</span></div>
            <div><strong>Total Vehicles:</strong> ${data.totalVehicles ?? 0}</div>
            <div><strong>Green Time:</strong> ${data.greenTime ?? 0} sec</div>
            <div><strong>Red Time:</strong> ${data.redTime ?? 0} sec</div>
            <div><strong>Last Updated:</strong> ${timestamp}</div>
        </div>
    `;

    marker.setPopupContent(popupHTML);
}

function updateTrendChart(data) {
    if (!lineChart) return;

    const timeStr = new Date().toLocaleTimeString();
    trendHistory.push({ time: timeStr, count: data.totalVehicles ?? 0 });

    if (trendHistory.length > 8) {
        trendHistory.shift();
    }

    lineChart.data.labels = trendHistory.map(item => item.time);
    lineChart.data.datasets[0].data = trendHistory.map(item => item.count);
    lineChart.update();
}

function renderRoutesPanel(routes) {
    const listContainer = document.getElementById("routes-list");
    listContainer.innerHTML = "";

    routes.forEach(route => {
        const card = document.createElement("div");
        card.className = `route-card ${route.recommended ? 'recommended' : ''}`;

        card.innerHTML = `
            <div class="route-header">
                <span>${route.name}</span>
                ${route.recommended ? '<span class="recommended-badge">★ Recommended</span>' : ''}
            </div>
            <div><strong>Distance:</strong> ${route.distance}</div>
            <div><strong>Est. Time:</strong> ${route.time}</div>
            <div><strong>Traffic:</strong> <span class="status-badge density-${route.traffic.toLowerCase()}">${route.traffic}</span></div>
        `;
        listContainer.appendChild(card);
    });
}

function renderRoutePolylines(routes) {
    routePolylines.forEach(p => map.removeLayer(p));
    routePolylines = [];

    routes.forEach(route => {
        const coords = ROUTE_COORDINATES[route.id] || ROUTE_COORDINATES[1];

        let polylineColor = "#3b82f6";
        if (route.recommended) polylineColor = "#22c55e";
        else if (route.traffic === "High") polylineColor = "#ef4444";
        else if (route.traffic === "Medium") polylineColor = "#f97316";

        const polyline = L.polyline(coords, {
            color: polylineColor,
            weight: route.recommended ? 6 : 4,
            opacity: 0.85,
            dashArray: route.recommended ? null : '6, 6'
        }).addTo(map);

        polyline.bindPopup(`<b>${route.name}</b><br>Distance: ${route.distance}<br>Time: ${route.time}`);
        routePolylines.push(polyline);
    });
}

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    updateClock();
    setInterval(updateClock, 1000);

    initMap();
    initCharts();

    // Initial fetch
    fetchLatestTrafficData();
    fetchAnalytics();
    fetchRoutesData();

    // Connect real-time STOMP WebSocket (Polling removed)
    connectWebSocket();
});
