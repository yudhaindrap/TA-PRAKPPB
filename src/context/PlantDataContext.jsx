import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const PlantDataContext = createContext();

export const usePlantData = () => useContext(PlantDataContext);

export const PlantDataProvider = ({ children }) => {
  const { session, isAuthenticated, refreshTotalPlantsCount } = useAuth();
  const [plants, setPlants] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlant, setSelectedPlant] = useState(null);

  // --- LOGIC ALARM GLOBAL DIMULAI DI SINI ---
  
  // 1. Meminta Izin Notifikasi saat aplikasi pertama dimuat
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // 2. Interval Pengecekan Waktu (Berjalan setiap 10 detik)
  useEffect(() => {
    if (!isAuthenticated || plants.length === 0) return;

    const checkSchedules = () => {
      const now = new Date();
      // Format Jam: HH:MM
      const currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
      // Format Tanggal Hari Ini: YYYY-MM-DD
      const todayDate = now.toISOString().split('T')[0];

      plants.forEach(plant => {
        if (!plant.watering_schedule || plant.watering_schedule.length === 0) return;

        // Cek apakah Jam Sekarang ada di Jadwal
        if (plant.watering_schedule.includes(currentTime)) {
          
          // KUNCI LOGIKA HARIAN:
          // Kita buat Key unik kombinasi ID Tanaman + Jam + Tanggal Hari Ini
          // Contoh Key: "notif-123-08:00-2023-11-28"
          const notifKey = `notif-${plant.id}-${currentTime}-${todayDate}`;
          const alreadyNotifiedToday = localStorage.getItem(notifKey);

          // Jika BELUM ada catatan notifikasi hari ini untuk jam ini
          if (!alreadyNotifiedToday) {
            
            // 1. Trigger Notifikasi Browser
            if (Notification.permission === "granted") {
              // Service Worker Registration check (opsional untuk PWA, fallback ke new Notification)
              if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                 navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(`Waktunya menyiram ${plant.name}!`, {
                      body: `Sekarang jam ${currentTime}, ayo cek tanamanmu! 🌱`,
                      icon: plant.image_url || '/icon.png',
                      vibrate: [200, 100, 200]
                    });
                 });
              } else {
                 new Notification(`Waktunya menyiram ${plant.name}!`, {
                   body: `Sekarang jam ${currentTime}, ayo cek tanamanmu! 🌱`,
                   icon: '/icon.png'
                 });
              }
            }

            // 2. Update Status Tanaman jadi "Butuh Air" (Kuning)
            // Kita paksa update walaupun statusnya masih 'false', agar user sadar
            updatePlant(plant.id, { needsWater: true });

            // 3. Simpan key ke LocalStorage agar tidak spamming di menit yang sama
            localStorage.setItem(notifKey, 'true');
            
            // Bersihkan localStorage lama (opsional, untuk hemat memori)
            // Hapus key kemarin
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = yesterday.toISOString().split('T')[0];
            localStorage.removeItem(`notif-${plant.id}-${currentTime}-${yesterdayDate}`);
          }
        }
      });
    };

    // Jalankan interval setiap 10 detik agar lebih presisi menangkap menit
    const intervalId = setInterval(checkSchedules, 10000);

    return () => clearInterval(intervalId);
  }, [plants, isAuthenticated]); 
  // Dependency 'plants' penting agar data jadwal selalu update

  // --- LOGIC ALARM SELESAI ---

  // ... (Sisa kode fetchAllPlants, addPlant, deletePlant, updatePlant sama seperti sebelumnya) ...
  
  const fetchAllPlants = async () => {
    if (!isAuthenticated) { setPlants([]); return; }
    const { data, error } = await supabase.from('plants').select('*').order('created_at', { ascending: false });
    if (error) console.error(error); else setPlants(data || []);
  };

  useEffect(() => { fetchAllPlants(); }, [isAuthenticated]);

  const refreshData = () => { fetchAllPlants(); };

  const addPlant = async (newPlantData) => {
    if (!isAuthenticated) return false;
    try {
      const plantWithUserId = { ...newPlantData, user_id: session.user.id };
      const { data, error } = await supabase.from('plants').insert(plantWithUserId).select().single();
      if (error) throw error;
      if (data) {
        setPlants(prev => [data, ...prev]);
        refreshTotalPlantsCount();
      }
      return true;
    } catch (error) {
      console.error(error); return false;
    }
  };

  const deletePlant = async (plantId) => {
    if (!isAuthenticated) return false;
    const previousPlants = [...plants];
    setPlants((prev) => prev.filter((p) => p.id !== plantId));
    setSelectedPlant(null);
    try {
      const { error } = await supabase.from('plants').delete().eq('id', plantId);
      if (error) throw error;
      refreshTotalPlantsCount();
      return true;
    } catch (error) {
      setPlants(previousPlants);
      return false;
    }
  };

  const updatePlant = async (plantId, updates) => {
    if (!isAuthenticated || !plantId) return false;
    const previousPlants = [...plants];
    const previousSelected = selectedPlant;

    setPlants((prev) => prev.map((p) => (p.id === plantId ? { ...p, ...updates } : p)));
    setSelectedPlant((prev) => (prev && prev.id === plantId ? { ...prev, ...updates } : prev));

    try {
      const { error } = await supabase.from('plants').update(updates).eq('id', plantId);
      if (error) throw error;
      return true;
    } catch (error) {
      setPlants(previousPlants);
      setSelectedPlant(previousSelected);
      return false;
    }
  };

  const handleDetail = (plant) => setSelectedPlant(plant);
  const handleBack = () => setSelectedPlant(null);
  const navigateTo = (tabName) => { setActiveTab(tabName); setSelectedPlant(null); };

  const value = {
    plants, activeTab, selectedPlant, handleDetail, handleBack, navigateTo, addPlant, deletePlant, updatePlant, refreshData,
  };

  return (
    <PlantDataContext.Provider value={value}>
      {children}
    </PlantDataContext.Provider>
  );
};