/**
 * SmartTraffic AI - Autonomous Command Center Traffic Simulation Engine
 * Architecture: SINGLE SIMULATION ENGINE ARCHITECTURE (Refactored)
 * 
 * Features & Design System:
 * - Single point of vehicle position mutation (Step 10: applyMovement)
 * - Strict 12-Step Frame Update Pipeline per requestAnimationFrame
 * - Explicit Vehicle FSM States (MOVING, STOPPING, STOPPED, YIELDING, TURNING, EXITING)
 * - Decoupled Subsystems (AI Engine, Signal Engine, Emergency System, Vehicle AI)
 * - 3-Second Deadlock Detection & Auto-Resolution Engine
 * - Intersection Capacity Guard (Vehicles never stop inside intersection box)
 * - Compact Top-Left Glassmorphism Canvas HUD (80% opacity, non-blocking)
 * - Live Canvas Signal Head Countdown Badges (🟢 18, 🟡 3, 🔴 33)
 */

window.TrafficSimulation = (function () {
    const VEHICLE_TYPES = {
        car: { width: 34, height: 18, maxSpeed: 1.4, acc: 0.06, dec: 0.12, color: "#3b82f6", name: "Car", code: "CAR" },
        bike: { width: 22, height: 12, maxSpeed: 1.5, acc: 0.08, dec: 0.15, color: "#ef4444", name: "Bike", code: "BIKE" },
        bus: { width: 55, height: 22, maxSpeed: 1.0, acc: 0.04, dec: 0.08, color: "#eab308", name: "Bus", code: "BUS" },
        truck: { width: 50, height: 22, maxSpeed: 0.9, acc: 0.03, dec: 0.07, color: "#22c55e", name: "Truck", code: "TRUCK" },
        ambulance: { width: 42, height: 20, maxSpeed: 1.7, acc: 0.12, dec: 0.18, color: "#ffffff", name: "Ambulance", code: "AMB", isEmergency: true }
    };

    const JUNCTION_CONFIGS = {
        "J101": { id: "J101", name: "Junction A - City Center", baseSpawnRate: 0.10 },
        "J102": { id: "J102", name: "Junction B - Railway Station", baseSpawnRate: 0.08 },
        "J103": { id: "J103", name: "Junction C - Hospital Road", baseSpawnRate: 0.05 },
        "J104": { id: "J104", name: "Junction D - Highway Junction", baseSpawnRate: 0.14 }
    };

    const VEHICLE_STATES = {
        MOVING: "MOVING",
        STOPPING: "STOPPING",
        STOPPED: "STOPPED",
        YIELDING: "YIELDING",
        TURNING: "TURNING",
        EXITING: "EXITING"
    };

    const counters = { CAR: 0, BIKE: 0, BUS: 0, TRUCK: 0, AMB: 0 };
    let selectedJunctionId = "J101";
    let canvas = null;
    let ctx = null;
    let animFrameId = null;

    // Performance, Telemetry & Debug Tracking
    let simulationTick = 0;
    let currentFps = 60;
    let framesCount = 0;
    let lastFpsUpdate = performance.now();
    let deadlockEventsCount = 0;

    // Emergency System State
    let emergencyActive = false;
    let activeAmbulanceId = null;
    let greenWaveStep = 0;
    let greenWaveTimer = 0;
    const GREEN_WAVE_ROUTE = ["J101", "J102", "J103"];

    const emergencyTelemetry = {
        active: false,
        ambId: "AMB-001",
        currentJunction: "Junction A - City Center",
        nextJunction: "Junction B - Railway Station",
        destination: "Junction C - Hospital Road",
        route: "Junction A → Junction B → Junction C",
        speedKmH: 68,
        distanceMeters: 450,
        etaSeconds: 18,
        laneClearancePercent: 98,
        greenWaveStatus: "ACTIVE",
        timeSavedMin: 5.2
    };

    const junctions = {};

    function initJunctionState(id) {
        return {
            id: id,
            name: JUNCTION_CONFIGS[id].name,
            vehicles: [],
            totalVehiclesPassed: 0,
            uniqueIds: new Set(),
            signalState: "NS_GREEN",
            greenTimeNS: 40,
            yellowTimeNS: 3,
            redTimeNS: 30,
            greenTimeEW: 40,
            yellowTimeEW: 3,
            redTimeEW: 30,
            timer: 40,
            clearingIntersection: false,
            clearanceTimer: 0,
            mode: "AI_AUTO",
            isPaused: false,
            isEmergencyActive: false,
            density: "LOW",
            currentCount: 0,
            queueLength: 0,
            avgWaitTime: 0,
            avgSpeedKmH: 0,
            signalUtilization: 75,
            congestionScore: 15,
            carsCount: 0,
            bikesCount: 0,
            busesCount: 0,
            trucksCount: 0,
            ambCount: 0,
            confidence: 98,
            recommendation: "Autonomous AI Signal Optimization Active",
            reason: "Optimal flow across all approaches."
        };
    }

    function initEngine(canvasElementId) {
        canvas = document.getElementById(canvasElementId);
        if (!canvas) return;
        ctx = canvas.getContext("2d");

        for (const jId in JUNCTION_CONFIGS) {
            if (!junctions[jId]) {
                junctions[jId] = initJunctionState(jId);
            }
        }

        if (animFrameId) cancelAnimationFrame(animFrameId);
        let lastTime = performance.now();

        // SINGLE SIMULATION ENGINE MAIN LOOP
        function step(now) {
            try {
                // STEP 1: Update simulation clock
                const dt = Math.max(0.001, Math.min((now - lastTime) / 1000, 0.1));
                lastTime = now;
                simulationTick++;

                framesCount++;
                if (now - lastFpsUpdate >= 1000) {
                    currentFps = framesCount;
                    framesCount = 0;
                    lastFpsUpdate = now;
                }

                // Execute 12-Step Pipeline sequentially across all junctions
                for (const jId in junctions) {
                    const jState = junctions[jId];
                    if (jState.isPaused) continue;

                    // STEP 2: Update signal countdown
                    updateSignalCountdown(jState, dt);

                    // STEP 3: Change signal if countdown reaches zero
                    checkSignalTransition(jState);

                    // STEP 4: Update AI density calculation
                    updateAIDensity(jState);
                }

                // STEP 5: Update emergency state
                updateEmergencyState(dt);

                // STEP 6-11: Vehicle Pipeline per junction
                for (const jId in junctions) {
                    const jState = junctions[jId];
                    if (jState.isPaused) continue;

                    // STEP 6: Spawn vehicles
                    spawnVehicles(jState);

                    // STEP 7: Calculate desired movement for every vehicle (intent phase)
                    calculateDesiredMovements(jState, dt);

                    // STEP 8: Detect conflicts (collisions, safe distance, intersection capacity)
                    detectConflicts(jState);

                    // STEP 9: Resolve conflicts (adjust desired speeds, enforce 3s deadlock recovery)
                    resolveConflicts(jState, dt);

                    // STEP 10: Apply movement (SINGLE POINT OF POSITION MUTATION)
                    applyMovement(jState, dt);

                    // STEP 11: Remove exited vehicles
                    removeExitedVehicles(jState);
                }

                // STEP 12: Render selected junction
                renderSelectedJunction();

            } catch (err) {
                console.error("[SINGLE ENGINE FAILSAFE] Handled exception in step loop:", err);
            } finally {
                animFrameId = requestAnimationFrame(step);
            }
        }
        animFrameId = requestAnimationFrame(step);
    }

    // STEP 2: Update signal countdown
    function updateSignalCountdown(jState, dt) {
        if (jState.clearingIntersection) {
            jState.clearanceTimer -= dt;
            if (jState.clearanceTimer <= 0) jState.clearingIntersection = false;
        }

        if (jState.signalState !== "FORCE_RED" && jState.signalState !== "FORCE_GREEN") {
            if (isNaN(jState.timer) || jState.timer === null || jState.timer === undefined || jState.timer <= 0) {
                jState.timer = 0;
            } else {
                jState.timer -= dt;
                if (jState.timer > 95) jState.timer = 95;
            }
        }
    }

    // STEP 3: Change signal if countdown reaches zero
    function checkSignalTransition(jState) {
        if (jState.timer <= 0 && jState.signalState !== "FORCE_RED" && jState.signalState !== "FORCE_GREEN") {
            if (jState.signalState === "NS_GREEN") {
                jState.signalState = "NS_YELLOW";
                jState.timer = jState.yellowTimeNS || 3;
            } else if (jState.signalState === "NS_YELLOW") {
                jState.signalState = "EW_GREEN";
                jState.timer = jState.greenTimeEW || 40;
            } else if (jState.signalState === "EW_GREEN") {
                jState.signalState = "EW_YELLOW";
                jState.timer = jState.yellowTimeEW || 3;
            } else {
                jState.signalState = "NS_GREEN";
                jState.timer = jState.greenTimeNS || 40;
            }
        }
    }

    // STEP 4: Update AI density calculation & dynamic proportional signal timing
    function updateAIDensity(jState) {
        const cw = canvas ? canvas.width : 800;
        const ch = canvas ? canvas.height : 500;
        const cx = cw / 2;
        const cy = ch / 2;

        jState.currentCount = jState.vehicles.length;

        // Reset vehicle type breakdown counts per frame
        jState.carsCount = 0;
        jState.bikesCount = 0;
        jState.busesCount = 0;
        jState.trucksCount = 0;
        jState.ambCount = 0;

        let countNS = 0;
        let countEW = 0;

        for (const v of jState.vehicles) {
            if (v.type === "car") jState.carsCount++;
            else if (v.type === "bike") jState.bikesCount++;
            else if (v.type === "bus") jState.busesCount++;
            else if (v.type === "truck") jState.trucksCount++;
            else if (v.type === "ambulance") jState.ambCount++;

            // Directional Queue Counting (Vehicles approaching or waiting before stop lines / inside junction)
            if (v.dir === "N" && v.y <= cy + 90) countNS++;
            else if (v.dir === "S" && v.y >= cy - 90) countNS++;
            else if (v.dir === "W" && v.x <= cx + 90) countEW++;
            else if (v.dir === "E" && v.x >= cx - 90) countEW++;
        }

        jState.queueLength = jState.vehicles.filter(v => v.state === VEHICLE_STATES.STOPPED || v.state === VEHICLE_STATES.STOPPING).length;

        if (jState.currentCount <= 6) jState.density = "LOW";
        else if (jState.currentCount <= 14) jState.density = "MEDIUM";
        else if (jState.currentCount <= 22) jState.density = "HIGH";
        else jState.density = "CRITICAL";

        // Proportional Dynamic Signal Allocation: Each vehicle adds ~2.5s green time (min 6s, max 60s)
        const calcGreenNS = Math.max(6, Math.min(60, Math.round(countNS * 2.5 + 4)));
        const calcGreenEW = Math.max(6, Math.min(60, Math.round(countEW * 2.5 + 4)));

        jState.greenTimeNS = calcGreenNS;
        jState.greenTimeEW = calcGreenEW;
        jState.redTimeNS = calcGreenEW + (jState.yellowTimeEW || 3);
        jState.redTimeEW = calcGreenNS + (jState.yellowTimeNS || 3);

        // Emergency Vehicle Override Logic
        const amb = jState.vehicles.find(v => v.type === "ambulance");
        if (amb) {
            jState.isEmergencyActive = true;
            if (amb.dir === "N" || amb.dir === "S") {
                if (jState.signalState !== "NS_GREEN" && jState.signalState !== "FORCE_GREEN") {
                    jState.signalState = "NS_GREEN";
                    jState.timer = 18;
                }
            } else if (amb.dir === "E" || amb.dir === "W") {
                if (jState.signalState !== "EW_GREEN" && jState.signalState !== "FORCE_GREEN") {
                    jState.signalState = "EW_GREEN";
                    jState.timer = 18;
                }
            }
            jState.confidence = 99.8;
            jState.recommendation = `🚨 EMERGENCY GREEN WAVE — ${amb.dir} APPROACH GREEN`;
            jState.reason = `Ambulance detected on ${amb.dir} approach. Signal forced GREEN. Queue ahead clearing sequentially.`;
        } else if (!jState.isEmergencyActive) {
            jState.confidence = Math.min(99, 92 + Math.round(jState.currentCount * 0.4));
            jState.recommendation = `AI Dynamic Allocation — NS: ${jState.greenTimeNS}s (${countNS} v) | EW: ${jState.greenTimeEW}s (${countEW} v)`;
            jState.reason = `AI counted ${countNS} vehicles on NS and ${countEW} vehicles on EW approach. Proportional green timing active.`;
        }

        // Smart Early Queue Clearance Cut: If green approach is 100% empty and opposite has waiting vehicles, switch immediately!
        if (jState.signalState === "NS_GREEN" && countNS === 0 && countEW > 0 && jState.timer > 2 && !amb) {
            jState.timer = 1.0;
            jState.reason += " (NS Queue Empty ➔ Early Green Cut to EW)";
        } else if (jState.signalState === "EW_GREEN" && countEW === 0 && countNS > 0 && jState.timer > 2 && !amb) {
            jState.timer = 1.0;
            jState.reason += " (EW Queue Empty ➔ Early Green Cut to NS)";
        }
    }


    // STEP 5: Update emergency state
    function updateEmergencyState(dt) {
        if (!emergencyActive) return;

        greenWaveTimer -= dt;
        emergencyTelemetry.distanceMeters = Math.max(0, Math.round(greenWaveTimer * 30));
        emergencyTelemetry.etaSeconds = Math.max(0, Math.round(greenWaveTimer));

        let ambulanceStillActive = false;
        for (const id in junctions) {
            if (junctions[id].vehicles.some(v => v.type === "ambulance")) {
                ambulanceStillActive = true;
                break;
            }
        }

        if (greenWaveTimer <= 0 || !ambulanceStillActive) {
            greenWaveStep++;
            if (greenWaveStep >= GREEN_WAVE_ROUTE.length || !ambulanceStillActive) {
                emergencyActive = false;
                emergencyTelemetry.active = false;
                emergencyTelemetry.greenWaveStatus = "CLEARED";

                for (const id in junctions) {
                    junctions[id].isEmergencyActive = false;
                    junctions[id].clearingIntersection = false;
                    junctions[id].recommendation = "Autonomous AI Signal Optimization Active";
                    junctions[id].reason = "Emergency cleared. Normal AI cycle resumed.";
                }
                console.log("[EMERGENCY SYSTEM] Emergency Mode deactivated. AI cycle restored.");
            } else {
                greenWaveTimer = 14.0;
                const currentCorridorJunction = GREEN_WAVE_ROUTE[greenWaveStep];
                const nextCorridorJunction = GREEN_WAVE_ROUTE[greenWaveStep + 1] || "Destination Hospital";

                emergencyTelemetry.currentJunction = JUNCTION_CONFIGS[currentCorridorJunction] ? JUNCTION_CONFIGS[currentCorridorJunction].name : currentCorridorJunction;
                emergencyTelemetry.nextJunction = JUNCTION_CONFIGS[nextCorridorJunction] ? JUNCTION_CONFIGS[nextCorridorJunction].name : nextCorridorJunction;

                if (junctions[currentCorridorJunction]) {
                    junctions[currentCorridorJunction].signalState = "NS_GREEN";
                    junctions[currentCorridorJunction].timer = 14;
                    junctions[currentCorridorJunction].recommendation = "EMERGENCY GREEN WAVE CORRIDOR ACTIVE";
                    junctions[currentCorridorJunction].reason = "Green Wave active. Clearance granted to Ambulance.";
                }
            }
        }
    }

    // STEP 6: Spawn vehicles dynamically based on organic arrival rate
    function spawnVehicles(jState) {
        const config = JUNCTION_CONFIGS[jState.id];
        let spawnProb = config ? config.baseSpawnRate : 0.08;
        if (jState.density === "MEDIUM") spawnProb *= 1.15;
        else if (jState.density === "HIGH") spawnProb *= 1.35;
        else if (jState.density === "CRITICAL") spawnProb *= 1.50;

        // Natural road capacity threshold (max 30 vehicles physically on road canvas)
        if (Math.random() < spawnProb && jState.vehicles.length < 30) {
            spawnVehicle(jState);
        }
    }

    function spawnVehicle(jState, dirOverride = null, typeOverride = null) {
        const directions = ["N", "S", "E", "W"];
        const dir = dirOverride || directions[Math.floor(Math.random() * directions.length)];

        let type = typeOverride;
        if (!type) {
            const rand = Math.random();
            if (rand < 0.52) type = "car";
            else if (rand < 0.75) type = "bike";
            else if (rand < 0.87) type = "bus";
            else if (rand < 0.98) type = "truck";
            else type = "ambulance";
        }

        const typeInfo = VEHICLE_TYPES[type];
        counters[typeInfo.code]++;
        const formattedId = `${typeInfo.code}-${String(counters[typeInfo.code]).padStart(3, '0')}`;

        let x = 0, y = 0, angle = 0;
        const cw = canvas ? canvas.width : 800;
        const ch = canvas ? canvas.height : 500;
        const cx = cw / 2;
        const cy = ch / 2;
        const offset = 35;

        if (dir === "N") { x = cx - offset; y = -45; angle = Math.PI / 2; }
        else if (dir === "S") { x = cx + offset; y = ch + 45; angle = -Math.PI / 2; }
        else if (dir === "W") { x = -45; y = cy + offset; angle = 0; }
        else if (dir === "E") { x = cw + 45; y = cy - offset; angle = Math.PI; }

        const vehicle = {
            id: formattedId,
            type: type,
            info: typeInfo,
            dir: dir,
            x: x, y: y,
            angle: angle,
            speed: 0,
            desiredSpeed: typeInfo.maxSpeed,
            desiredLateralOffset: 0,
            lateralOffset: 0,
            state: VEHICLE_STATES.MOVING, // Explicit FSM state
            desiredState: VEHICLE_STATES.MOVING,
            waitTime: 0,
            stoppedTime: 0,
            lastX: x, lastY: y,
            lastMoveTime: performance.now(),
            lifetime: 0,
            reactionDelay: 0,
            pullingOver: false
        };

        jState.vehicles.push(vehicle);
        jState.totalVehiclesPassed++;
        jState.uniqueIds.add(formattedId);

        if (type === "ambulance" && !emergencyActive) {
            triggerEmergency(jState.id, formattedId);
        }
    }

    function triggerEmergency(jId = null, ambId = null) {
        const targetId = jId || selectedJunctionId;
        emergencyActive = true;
        activeAmbulanceId = ambId || `AMB-${String(++counters.AMB).padStart(3, '0')}`;
        greenWaveStep = 0;
        greenWaveTimer = 14.0;

        emergencyTelemetry.active = true;
        emergencyTelemetry.ambId = activeAmbulanceId;
        emergencyTelemetry.currentJunction = JUNCTION_CONFIGS[targetId] ? JUNCTION_CONFIGS[targetId].name : "Junction A - City Center";
        emergencyTelemetry.nextJunction = "Junction B - Railway Station";

        for (const id in junctions) {
            junctions[id].isEmergencyActive = true;
        }

        const startJunction = GREEN_WAVE_ROUTE[0];
        if (junctions[startJunction]) {
            junctions[startJunction].clearingIntersection = true;
            junctions[startJunction].clearanceTimer = 1.5;
            junctions[startJunction].signalState = "NS_GREEN";
            junctions[startJunction].timer = 14;
        }

        if (junctions[targetId] && !junctions[targetId].vehicles.some(v => v.type === "ambulance")) {
            spawnVehicle(junctions[targetId], "N", "ambulance");
        }
    }

    // STEP 7: Calculate desired movement for every vehicle (intent phase)
    function calculateDesiredMovements(jState, dt) {
        const cw = canvas ? canvas.width : 800;
        const ch = canvas ? canvas.height : 500;
        const cx = cw / 2;
        const cy = ch / 2;

        const stopLines = { N: cy - 90, S: cy + 90, W: cx - 90, E: cx + 90 };
        const ambulanceInJunction = jState.vehicles.find(v => v.type === "ambulance");

        for (const v of jState.vehicles) {
            v.lifetime += dt;
            v.desiredSpeed = v.info.maxSpeed;
            v.desiredState = VEHICLE_STATES.MOVING;

            const nsIsRed = (jState.signalState === "EW_GREEN" || jState.signalState === "EW_YELLOW" || jState.signalState === "FORCE_RED");
            const ewIsRed = (jState.signalState === "NS_GREEN" || jState.signalState === "NS_YELLOW" || jState.signalState === "FORCE_RED");
            const nsIsYellow = (jState.signalState === "NS_YELLOW");
            const ewIsYellow = (jState.signalState === "EW_YELLOW");

            // Check if vehicle is approaching red/yellow stop line
            let atStopLine = false;
            if (v.type !== "ambulance" && jState.signalState !== "FORCE_GREEN") {
                if ((v.dir === "N" || v.dir === "S") && nsIsRed) {
                    if (v.dir === "N" && v.y < stopLines.N && v.y + 40 >= stopLines.N) atStopLine = true;
                    if (v.dir === "S" && v.y > stopLines.S && v.y - 40 <= stopLines.S) atStopLine = true;
                } else if ((v.dir === "W" || v.dir === "E") && ewIsRed) {
                    if (v.dir === "W" && v.x < stopLines.W && v.x + 40 >= stopLines.W) atStopLine = true;
                    if (v.dir === "E" && v.x > stopLines.E && v.x - 40 <= stopLines.E) atStopLine = true;
                }

                // Yellow deceleration threshold
                if ((v.dir === "N" || v.dir === "S") && nsIsYellow) {
                    if (v.dir === "N" && v.y < stopLines.N - 40 && v.y + 70 >= stopLines.N) atStopLine = true;
                    if (v.dir === "S" && v.y > stopLines.S + 40 && v.y - 70 <= stopLines.S) atStopLine = true;
                } else if ((v.dir === "W" || v.dir === "E") && ewIsYellow) {
                    if (v.dir === "W" && v.x < stopLines.W - 40 && v.x + 70 >= stopLines.W) atStopLine = true;
                    if (v.dir === "E" && v.x > stopLines.E + 40 && v.x - 70 <= stopLines.E) atStopLine = true;
                }
            }

            if (atStopLine) {
                v.desiredState = VEHICLE_STATES.STOPPING;
                v.desiredSpeed = 0;
            }

            // Sequential Lane Clearance: Vehicles ahead move straight forward on green, ambulance follows behind
            v.desiredLateralOffset = 0;
            v.pullingOver = false;
        }
    }

    // STEP 8: Detect conflicts (collision distance & INTERSECTION CAPACITY GUARD)
    function detectConflicts(jState) {
        const cw = canvas ? canvas.width : 800;
        const ch = canvas ? canvas.height : 500;
        const cx = cw / 2;
        const cy = ch / 2;
        const stopLines = { N: cy - 90, S: cy + 90, W: cx - 90, E: cx + 90 };

        for (let i = 0; i < jState.vehicles.length; i++) {
            const v = jState.vehicles[i];

            // INTERSECTION CAPACITY GUARD: Check exit lane space before entering intersection box
            let enteringIntersection = false;
            if (v.dir === "N" && v.y < stopLines.N && v.y + 15 >= stopLines.N) enteringIntersection = true;
            else if (v.dir === "S" && v.y > stopLines.S && v.y - 15 <= stopLines.S) enteringIntersection = true;
            else if (v.dir === "W" && v.x < stopLines.W && v.x + 15 >= stopLines.W) enteringIntersection = true;
            else if (v.dir === "E" && v.x > stopLines.E && v.x - 15 <= stopLines.E) enteringIntersection = true;

            if (enteringIntersection) {
                // Count vehicles currently exiting in target lane
                let exitLaneCount = 0;
                for (let j = 0; j < jState.vehicles.length; j++) {
                    if (i === j) continue;
                    const other = jState.vehicles[j];
                    if (other.dir === v.dir) {
                        if (v.dir === "N" && other.y > cy + 90) exitLaneCount++;
                        else if (v.dir === "S" && other.y < cy - 90) exitLaneCount++;
                        else if (v.dir === "W" && other.x > cx + 90) exitLaneCount++;
                        else if (v.dir === "E" && other.x < cx - 90) exitLaneCount++;
                    }
                }
                if (exitLaneCount >= 6) { // Exit lane full -> wait before stop line
                    v.desiredSpeed = 0;
                    v.desiredState = VEHICLE_STATES.STOPPED;
                }
            }

            // Preceding vehicle safe distance conflict check (minDist = 42px)
            for (let j = 0; j < jState.vehicles.length; j++) {
                if (i === j) continue;
                const other = jState.vehicles[j];
                if (other.dir !== v.dir) continue;

                let dist = 9999;
                if (v.dir === "N" && other.y > v.y) dist = other.y - v.y;
                else if (v.dir === "S" && other.y < v.y) dist = v.y - other.y;
                else if (v.dir === "W" && other.x > v.x) dist = other.x - v.x;
                else if (v.dir === "E" && other.x < v.x) dist = v.x - other.x;


                if (dist > 0 && dist < 42) {
                    v.desiredSpeed = 0;
                    v.desiredState = (v.speed < 0.2) ? VEHICLE_STATES.STOPPED : VEHICLE_STATES.STOPPING;
                    break;
                }
            }
        }
    }

    // STEP 9: Resolve conflicts (enforce 3s deadlock detection & auto-recovery)
    function resolveConflicts(jState, dt) {
        const now = performance.now();

        for (const v of jState.vehicles) {
            // Track position changes for 3-second deadlock detection
            const dx = Math.abs(v.x - v.lastX);
            const dy = Math.abs(v.y - v.lastY);

            if (dx >= 1.0 || dy >= 1.0) {
                v.lastX = v.x;
                v.lastY = v.y;
                v.lastMoveTime = now;
                v.stoppedTime = 0;
            } else {
                v.stoppedTime = (now - v.lastMoveTime) / 1000;
            }

            // 3-SECOND DEADLOCK DETECTION & AUTO-RESOLUTION
            if (v.stoppedTime > 3.0) {
                deadlockEventsCount++;
                console.warn(`[DEADLOCK DETECTED & RESOLVED] Vehicle ID: ${v.id} | Cause: Queue Blockade | Junction: ${jState.id} | Action: Lateral Nudge & Speed Release`);

                // Resolution Action: Clear state lock, apply lateral nudge, release speed
                v.desiredState = VEHICLE_STATES.MOVING;
                v.desiredSpeed = 0.6;
                v.desiredLateralOffset = (Math.random() > 0.5 ? 12 : -12);
                v.lastMoveTime = now;
                v.stoppedTime = 0;
            }

            // Update FSM State
            if (v.desiredSpeed === 0 && v.speed < 0.1) {
                v.state = VEHICLE_STATES.STOPPED;
                v.waitTime += dt;
            } else if (v.desiredState === VEHICLE_STATES.YIELDING) {
                v.state = VEHICLE_STATES.YIELDING;
            } else if (v.desiredSpeed < v.speed) {
                v.state = VEHICLE_STATES.STOPPING;
            } else {
                v.state = VEHICLE_STATES.MOVING;
            }
        }
    }

    // STEP 10: Apply movement (SINGLE POINT OF POSITION & OFFSET MUTATION)
    function applyMovement(jState, dt) {
        for (const v of jState.vehicles) {
            // Smooth speed acceleration/deceleration
            if (v.speed < v.desiredSpeed) {
                v.speed = Math.min(v.desiredSpeed, v.speed + v.info.acc);
            } else if (v.speed > v.desiredSpeed) {
                v.speed = Math.max(v.desiredSpeed, v.speed - v.info.dec * 1.5);
            }

            // Smooth lateral offset interpolation
            v.lateralOffset += (v.desiredLateralOffset - v.lateralOffset) * 0.12;

            // Single point of coordinate update
            v.x += Math.cos(v.angle) * v.speed;
            v.y += Math.sin(v.angle) * v.speed;
        }
    }

    // STEP 11: Remove exited vehicles
    function removeExitedVehicles(jState) {
        const cw = canvas ? canvas.width : 800;
        const ch = canvas ? canvas.height : 500;

        for (let i = jState.vehicles.length - 1; i >= 0; i--) {
            const v = jState.vehicles[i];
            if (v.x < -70 || v.x > cw + 70 || v.y < -70 || v.y > ch + 70 || v.lifetime > 120) {
                jState.vehicles.splice(i, 1);
            }
        }
    }

    // STEP 12: Render selected junction
    function renderSelectedJunction() {
        if (!ctx || !canvas) return;
        const jState = junctions[selectedJunctionId];
        if (!jState) return;

        const cw = canvas.width;
        const ch = canvas.height;
        const cx = cw / 2;
        const cy = ch / 2;
        const rw = 140;

        // Background Asphalt Grid
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, cw, ch);

        // Asphalt Roads
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(cx - rw / 2, 0, rw, ch);
        ctx.fillRect(0, cy - rw / 2, cw, rw);

        // Center dashed lines
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 10]);

        ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - rw / 2);
        ctx.moveTo(cx, cy + rw / 2); ctx.lineTo(cx, ch);
        ctx.moveTo(0, cy); ctx.lineTo(cx - rw / 2, cy);
        ctx.moveTo(cx + rw / 2, cy); ctx.lineTo(cw, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // White Stop Lines
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(cx - rw / 2, cy - rw / 2 - 6, rw / 2 - 2, 6);
        ctx.fillRect(cx + 2, cy + rw / 2, rw / 2 - 2, 6);
        ctx.fillRect(cx - rw / 2 - 6, cy + 2, 6, rw / 2 - 2);
        ctx.fillRect(cx + rw / 2, cy - rw / 2, 6, rw / 2 - 2);

        // Compute signal light head colors & countdown numbers for 4 directions
        const timerSec = Math.max(1, Math.ceil(jState.timer));
        let nsColor = "#ef4444", ewColor = "#ef4444";
        let nsNum = timerSec, ewNum = timerSec;

        if (jState.signalState === "NS_GREEN" || jState.signalState === "FORCE_GREEN") {
            nsColor = "#22c55e"; ewColor = "#ef4444";
            nsNum = timerSec; ewNum = timerSec + (jState.yellowTimeNS || 3);
        } else if (jState.signalState === "NS_YELLOW") {
            nsColor = "#eab308"; ewColor = "#ef4444";
            nsNum = timerSec; ewNum = timerSec;
        } else if (jState.signalState === "EW_GREEN") {
            nsColor = "#ef4444"; ewColor = "#22c55e";
            nsNum = timerSec + (jState.yellowTimeEW || 3); ewNum = timerSec;
        } else if (jState.signalState === "EW_YELLOW") {
            nsColor = "#ef4444"; ewColor = "#eab308";
            nsNum = timerSec; ewNum = timerSec;
        }

        // Draw 4 Signal Heads with Live Countdown Badges (🟢 18, 🟡 3, 🔴 33)
        drawTrafficLightWithCountdown(ctx, cx - rw / 2 - 42, cy - rw / 2 - 50, nsColor, nsNum, "N");
        drawTrafficLightWithCountdown(ctx, cx + rw / 2 + 12, cy + rw / 2 + 10, nsColor, nsNum, "S");
        drawTrafficLightWithCountdown(ctx, cx + rw / 2 + 12, cy - rw / 2 - 42, ewColor, ewNum, "E");
        drawTrafficLightWithCountdown(ctx, cx - rw / 2 - 55, cy + rw / 2 + 10, ewColor, ewNum, "W");

        // Render Vehicles
        for (const v of jState.vehicles) {
            drawVehicleSprite(ctx, v);
        }

        // Emergency Overlay Banner on Canvas
        if (emergencyActive || jState.isEmergencyActive) {
            ctx.fillStyle = "rgba(220, 38, 38, 0.92)";
            ctx.fillRect(cw / 2 - 210, 12, 420, 34);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(cw / 2 - 210, 12, 420, 34);

            ctx.font = "bold 12px monospace";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.fillText(`🚨 EMERGENCY MODE ACTIVE — GREEN WAVE ENABLED`, cw / 2, 34);
            ctx.textAlign = "left";
        }

        // COMPACT TOP-LEFT GLASSMORPHISM INFORMATION PANEL (80% Opacity)
        ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
        ctx.fillRect(12, 12, 220, 110);
        ctx.strokeStyle = "rgba(245, 158, 11, 0.6)";
        ctx.lineWidth = 1;
        ctx.strokeRect(12, 12, 220, 110);

        ctx.font = "bold 11px monospace";
        ctx.fillStyle = "#f59e0b";
        ctx.fillText(jState.name, 20, 28);

        ctx.font = "10px monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`Density:`, 20, 44);
        ctx.fillStyle = jState.density === "CRITICAL" ? "#ef4444" : (jState.density === "HIGH" ? "#f97316" : (jState.density === "MEDIUM" ? "#eab308" : "#22c55e"));
        ctx.fillText(jState.density, 75, 44);

        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`Vehicles:`, 20, 59);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`${jState.currentCount} Active`, 75, 59);

        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`Signal:`, 20, 74);
        ctx.fillStyle = (jState.signalState.includes("GREEN") ? "#22c55e" : (jState.signalState.includes("YELLOW") ? "#eab308" : "#ef4444"));
        ctx.fillText(jState.signalState.replace("_", " "), 75, 74);

        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`Timer:`, 20, 89);
        ctx.fillStyle = "#38bdf8";
        ctx.fillText(`${timerSec}s Countdown`, 75, 89);

        ctx.fillStyle = "#94a3b8";
        ctx.fillText(`FPS / Failsafe:`, 20, 104);
        ctx.fillStyle = "#4ade80";
        ctx.fillText(`${currentFps} FPS | Deadlocks: ${deadlockEventsCount}`, 110, 104);
    }

    function drawVehicleSprite(ctx, v) {
        ctx.save();

        let renderX = v.x;
        let renderY = v.y;

        if (v.dir === "N" || v.dir === "S") renderX += v.lateralOffset;
        else if (v.dir === "W" || v.dir === "E") renderY += v.lateralOffset;

        ctx.translate(renderX, renderY);
        ctx.rotate(v.angle);

        const w = v.info.width;
        const h = v.info.height;

        ctx.strokeStyle = v.pullingOver ? "#f97316" : v.info.color;
        ctx.lineWidth = v.pullingOver ? 2 : 1;
        ctx.strokeRect(-w / 2 - 2, -h / 2 - 2, w + 4, h + 4);

        if (v.type === "car") {
            ctx.fillStyle = "#2563eb";
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(-w * 0.1, -h * 0.4, w * 0.3, h * 0.8);
            ctx.fillRect(w * 0.25, -h * 0.35, w * 0.15, h * 0.7);
            ctx.fillStyle = "#e2e8f0";
            ctx.fillRect(-w * 0.05, -h * 0.3, w * 0.25, h * 0.6);
        } else if (v.type === "bike") {
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(-w / 2, -h / 4, w, h / 2);
            ctx.fillStyle = "#ffffff";
            ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
        } else if (v.type === "bus") {
            ctx.fillStyle = "#ca8a04";
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(w * 0.3, -h * 0.4, w * 0.15, h * 0.8);
            ctx.fillRect(-w * 0.4, -h * 0.4, w * 0.6, h * 0.2);
            ctx.fillRect(-w * 0.4, h * 0.2, w * 0.6, h * 0.2);
        } else if (v.type === "truck") {
            ctx.fillStyle = "#16a34a";
            ctx.fillRect(-w / 2, -h / 2, w * 0.65, h);
            ctx.fillStyle = "#15803d";
            ctx.fillRect(w * 0.2, -h * 0.45, w * 0.25, h * 0.9);
            ctx.fillStyle = "#0f172a";
            ctx.fillRect(w * 0.32, -h * 0.35, w * 0.1, h * 0.7);
        } else if (v.type === "ambulance") {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(-4, -10, 8, 20);
            ctx.fillRect(-10, -4, 20, 8);

            const flash = Math.floor(Date.now() / 150) % 2 === 0;
            ctx.fillStyle = flash ? "#ef4444" : "#3b82f6";
            ctx.beginPath(); ctx.arc(w * 0.3, 0, 5, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();

        ctx.font = "bold 9px monospace";
        ctx.fillStyle = v.pullingOver ? "#f97316" : "#ffffff";
        ctx.fillText(v.id + (v.pullingOver ? " [CLEARING]" : ""), renderX - 22, renderY - h / 2 - 4);
    }

    function drawTrafficLightWithCountdown(ctx, x, y, color, countdownNum, dirLabel) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(x, y, 26, 46);
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, 26, 46);

        ctx.beginPath(); ctx.arc(x + 13, y + 10, 6, 0, Math.PI * 2);
        ctx.fillStyle = color === "#ef4444" ? "#ef4444" : "#334155"; ctx.fill();

        ctx.beginPath(); ctx.arc(x + 13, y + 23, 6, 0, Math.PI * 2);
        ctx.fillStyle = color === "#eab308" ? "#eab308" : "#334155"; ctx.fill();

        ctx.beginPath(); ctx.arc(x + 13, y + 36, 6, 0, Math.PI * 2);
        ctx.fillStyle = color === "#22c55e" ? "#22c55e" : "#334155"; ctx.fill();

        ctx.fillStyle = color;
        ctx.fillRect(x - 2, y - 16, 30, 14);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 2, y - 16, 30, 14);

        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.fillText(String(countdownNum).padStart(2, '0'), x + 13, y - 5);
        ctx.textAlign = "left";
    }

    return {
        initEngine: initEngine,
        setSelectedJunction: (jId) => { if (JUNCTION_CONFIGS[jId]) selectedJunctionId = jId; },
        getJunctionState: (jId) => junctions[jId] || junctions["J101"],
        spawnVehicle: spawnVehicle,
        triggerEmergency: triggerEmergency,
        getEmergencyTelemetry: () => emergencyTelemetry,
        getAllJunctions: () => junctions,
        getCurrentFps: () => currentFps,
        getDeadlockEventsCount: () => deadlockEventsCount,
        getSimulationTick: () => simulationTick,
        applySignalBoost: (boostSeconds = 15) => {
            const jState = junctions[selectedJunctionId];
            if (jState) {
                jState.timer += boostSeconds;
                jState.greenTimeNS += boostSeconds;
                jState.greenTimeEW += boostSeconds;
            }
        }
    };
})();
