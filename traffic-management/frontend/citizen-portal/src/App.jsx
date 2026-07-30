import React, { useState, useEffect } from 'react';
import TopHeader from './components/TopHeader';
import CityStatusCard from './components/CityStatusCard';
import AiDailyBrief from './components/AiDailyBrief';
import QuickActions from './components/QuickActions';
import RecentEvents from './components/RecentEvents';
import RecommendedRouteCard from './components/RecommendedRouteCard';
import LiveMapPreviewCard from './components/LiveMapPreviewCard';
import BottomNav from './components/BottomNav';
import SmartRoutePlanner from './components/SmartRoutePlanner';
import AiGreenWaveAssistant from './components/AiGreenWaveAssistant';
import LiveTrafficIncidentCenter from './components/LiveTrafficIncidentCenter';

// Skeleton Component
import SkeletonLoader from './components/SkeletonLoader';

// Modals
import LiveTrafficMapModal from './components/modals/LiveTrafficMapModal';
import AlertsModal from './components/modals/AlertsModal';
import ParkingModal from './components/modals/ParkingModal';
import MyTripsModal from './components/modals/MyTripsModal';
import ProfileModal from './components/modals/ProfileModal';

const API_BASE_URL = "http://localhost:8080/api";

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeModal, setActiveModal] = useState(null);
  
  // Theme State: 'dark' | 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('smarttraffic_citizen_theme') || 'dark';
  });

  // Loading Skeleton state
  const [isLoading, setIsLoading] = useState(true);

  // Sync theme with HTML document data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('smarttraffic_citizen_theme', theme);
  }, [theme]);

  // Initial skeleton timer for smooth load transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Live Traffic State
  const [trafficData, setTrafficData] = useState({
    density: 'Moderate',
    totalVehicles: 1420,
    avgTravelTime: '14 min',
    avgSpeed: '42 km/h',
    activeIncidents: 2,
    aiStatus: '⚡ AI Signal Optimization Active',
    avgWaitingTime: '45 sec',
    signalsOptimized: '18 Signals',
    emergencyActive: '1 Priority Vehicle',
    congestionLevel: '24% (Normal)'
  });

  const [aiRecommendation, setAiRecommendation] = useState({
    trafficState: "Traffic is moderate.",
    fastestCorridor: "Hospital Road is currently the fastest corridor.",
    expectedDelays: "Expected delays near Railway Station.",
    bestTime: "8:20 AM",
    fuelSaving: "12%"
  });

  const [events, setEvents] = useState([]);

  // Fetch real-time traffic data
  useEffect(() => {
    let isSubscribed = true;

    async function loadLiveData() {
      try {
        const [trafficRes, recRes, analyticsRes, emergencyRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/traffic/all`),
          fetch(`${API_BASE_URL}/routes/recommendation`),
          fetch(`${API_BASE_URL}/dashboard/analytics`),
          fetch(`${API_BASE_URL}/emergency/status`)
        ]);

        if (!isSubscribed) return;

        let liveDensity = "Moderate";
        let liveVehicles = 1420;
        let liveWait = "45 sec";

        if (trafficRes.status === 'fulfilled' && trafficRes.value.ok) {
          const list = await trafficRes.value.json();
          if (Array.isArray(list) && list.length > 0) {
            const latest = list[list.length - 1];
            liveDensity = latest.density || "Moderate";
            liveVehicles = latest.totalVehicles || 1420;
          }
        }

        if (analyticsRes.status === 'fulfilled' && analyticsRes.value.ok) {
          const analytics = await analyticsRes.value.json();
          if (analytics?.averageWaitingAfter) {
            liveWait = `${analytics.averageWaitingAfter} sec`;
          }
        }

        let emergencyText = "Clear (0 Active)";
        if (emergencyRes.status === 'fulfilled' && emergencyRes.value.ok) {
          const emg = await emergencyRes.value.json();
          if (emg?.activeEmergency) {
            emergencyText = `${emg.vehicleType || "1 Ambulance"} Priority`;
          }
        }

        if (recRes.status === 'fulfilled' && recRes.value.ok) {
          const rec = await recRes.value.json();
          setAiRecommendation({
            trafficState: `Traffic is ${liveDensity.toLowerCase()}.`,
            fastestCorridor: rec.recommendedRoute ? `${rec.recommendedRoute} is currently the fastest corridor.` : "Hospital Road is currently the fastest corridor.",
            expectedDelays: rec.reason || "Expected delays near Railway Station.",
            bestTime: "8:20 AM",
            fuelSaving: rec.estimatedCo2Reduction || "12%"
          });
        }

        setTrafficData({
          density: liveDensity,
          totalVehicles: liveVehicles,
          avgTravelTime: liveDensity.toLowerCase() === 'high' ? '22 min' : '14 min',
          avgSpeed: liveDensity.toLowerCase() === 'high' ? '28 km/h' : '42 km/h',
          activeIncidents: liveDensity.toLowerCase() === 'high' ? 4 : 2,
          aiStatus: '⚡ AI Signal Optimization Active',
          avgWaitingTime: liveWait,
          signalsOptimized: '18 Signals',
          emergencyActive: emergencyText,
          congestionLevel: liveDensity.toLowerCase() === 'high' ? '68% (Heavy)' : '24% (Normal)'
        });

      } catch (err) {
        // Fallback generator handles state
      }
    }

    loadLiveData();
    const interval = setInterval(loadLiveData, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, []);

  // Quick Action Primary Navigation handler
  const handleSelectNavPage = (pageKey) => {
    if (pageKey === 'home') {
      setActiveTab('home');
      setActiveModal(null);
    } else if (pageKey === 'routes') {
      setActiveTab('routes');
      setActiveModal(null);
    } else if (pageKey === 'greenwave') {
      setActiveTab('greenwave');
      setActiveModal(null);
    } else if (pageKey === 'incident' || pageKey === 'alerts') {
      setActiveTab('incident');
      setActiveModal(null);
    } else {
      setActiveModal(pageKey);
    }
  };

  return (
    <div className="app-container">
      {/* Top Header with Global Items (Profile, Settings, Notifications, Weather, Time) */}
      <TopHeader 
        cityName="Ahmedabad Smart City" 
        theme={theme} 
        onToggleTheme={toggleTheme}
        onOpenProfile={() => setActiveModal('profile')}
        onOpenSettings={() => setActiveModal('profile')}
        onOpenNotifications={() => setActiveTab('incident')}
      />

      {/* RENDER VIEW ACCORDING TO ACTIVE TAB */}
      {isLoading ? (
        <div className="d-flex flex-column gap-3">
          <SkeletonLoader type="city-status" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="list" />
        </div>
      ) : activeTab === 'routes' ? (
        <SmartRoutePlanner onBackToHome={() => setActiveTab('home')} />
      ) : activeTab === 'greenwave' ? (
        <AiGreenWaveAssistant onBackToHome={() => setActiveTab('home')} />
      ) : activeTab === 'incident' ? (
        <LiveTrafficIncidentCenter
          onBackToHome={() => setActiveTab('home')}
          onOpenRoutePlanner={() => setActiveTab('routes')}
        />
      ) : (
        <>
          {/* 1. City Traffic Status */}
          <CityStatusCard trafficData={trafficData} />

          {/* 2. Today's AI Travel Brief */}
          <AiDailyBrief
            recommendation={aiRecommendation}
            onLaunchGreenWave={() => setActiveTab('greenwave')}
          />

          {/* 3. Quick Actions (Primary Navigation System) */}
          <QuickActions 
            activePage={activeTab} 
            onSelectPage={handleSelectNavPage} 
          />

          {/* 4. Recent Alerts */}
          <RecentEvents 
            eventsList={events} 
            onViewAllAlerts={() => setActiveTab('incident')} 
          />

          {/* 5. Recommended Route */}
          <RecommendedRouteCard 
            onOpenRoutePlanner={() => setActiveTab('routes')} 
          />

          {/* 6. Live Map Preview */}
          <LiveMapPreviewCard 
            onExpandMap={() => setActiveModal('traffic')} 
          />
        </>
      )}

      {/* Bottom Navigation Bar */}
      <BottomNav activeTab={activeTab} setActiveTab={handleSelectNavPage} />

      {/* Modals */}
      <LiveTrafficMapModal isOpen={activeModal === 'traffic'} onClose={() => setActiveModal(null)} trafficData={trafficData} />
      <AlertsModal isOpen={activeModal === 'alerts'} onClose={() => setActiveModal(null)} />
      <ParkingModal isOpen={activeModal === 'parking'} onClose={() => setActiveModal(null)} />
      <MyTripsModal isOpen={activeModal === 'trips'} onClose={() => setActiveModal(null)} />
      <ProfileModal isOpen={activeModal === 'profile'} onClose={() => setActiveModal(null)} />
    </div>
  );
}
