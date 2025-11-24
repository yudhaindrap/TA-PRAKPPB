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

  // Fetch Data
  const fetchAllPlants = async () => {
    if (!isAuthenticated) {
      setPlants([]);
      return;
    }

    const { data, error } = await supabase
      .from('plants')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching plants:', error);
    } else {
      setPlants(data || []);
    }
  };

  useEffect(() => {
    fetchAllPlants();
  }, [isAuthenticated]);

  const refreshData = () => {
    fetchAllPlants();
  };

  // ADD PLANT
  const addPlant = async (newPlantData) => {
    if (!isAuthenticated) return false;

    try {
      const plantWithUserId = { ...newPlantData, user_id: session.user.id };

      // Insert ke DB
      const { data, error } = await supabase
        .from('plants')
        .insert(plantWithUserId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPlants(prev => [data, ...prev]); // Update lokal
        refreshTotalPlantsCount(); // Update counter
      }
      return true;
    } catch (error) {
      console.error('Error adding plant:', error);
      return false;
    }
  };

  // DELETE PLANT (OPTIMISTIC) 
  // "Hapus dulu di layar, baru lapor ke server"
  const deletePlant = async (plantId) => {
    if (!isAuthenticated) return false;

    // 1. Update UI SECARA INSTAN
    const previousPlants = [...plants]; // Simpan backup jika gagal
    setPlants((prev) => prev.filter((p) => p.id !== plantId));
    setSelectedPlant(null); // Tutup detail page langsung

    try {
      // 2. Kirim request ke Server
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plantId);

      if (error) throw error;

      // Sukses di server, update counter
      refreshTotalPlantsCount();
      return true;

    } catch (error) {
      console.error('Error deleting plant:', error);
      // Jika gagal, kembalikan data lama (Rollback)
      setPlants(previousPlants);
      alert("Gagal menghapus tanaman. Periksa koneksi internet.");
      return false;
    }
  };

  // UPDATE PLANT (OPTIMISTIC)
  // "Ubah dulu di layar, baru lapor ke server"
  const updatePlant = async (plantId, updates) => {
    if (!isAuthenticated || !plantId) return false;

    // 1. Update UI SECARA INSTAN
    const previousPlants = [...plants]; // Backup
    const previousSelected = selectedPlant; // Backup

    // Update list di Home
    setPlants((prev) =>
      prev.map((p) => (p.id === plantId ? { ...p, ...updates } : p))
    );

    // Update tampilan Detail Page (PENTING AGAR TIDAK TERASA LAMBAT DI DETAIL)
    setSelectedPlant((prev) => (prev && prev.id === plantId ? { ...prev, ...updates } : prev));

    try {
      // 2. Kirim request ke Server
      const { error } = await supabase
        .from('plants')
        .update(updates)
        .eq('id', plantId);

      if (error) throw error;
      return true;

    } catch (error) {
      console.error('Error updating plant:', error);
      // Rollback jika gagal
      setPlants(previousPlants);
      setSelectedPlant(previousSelected);
      return false;
    }
  };

  // Navigasi
  const handleDetail = (plant) => setSelectedPlant(plant);
  const handleBack = () => setSelectedPlant(null);
  const navigateTo = (tabName) => {
    setActiveTab(tabName);
    setSelectedPlant(null);
  };

  const value = {
    plants,
    activeTab,
    selectedPlant,
    handleDetail,
    handleBack,
    navigateTo,
    addPlant,
    deletePlant,
    updatePlant,
    refreshData,
  };

  return (
    <PlantDataContext.Provider value={value}>
      {children}
    </PlantDataContext.Provider>
  );
};