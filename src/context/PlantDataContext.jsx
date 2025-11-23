import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';

const PlantDataContext = createContext();

export const usePlantData = () => useContext(PlantDataContext);

export const PlantDataProvider = ({ children }) => {
  // ✅ PERBAIKAN: Ambil SEMUA yang dibutuhkan DARI DALAM KOMPONEN
  const { session, isAuthenticated, refreshTotalPlantsCount } = useAuth(); 
  // Baris global hook yang salah sudah dihapus dari file

  const [plants, setPlants] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Ambil semua data tanaman
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
      return;
    }

    setPlants(data || []);
  };

  // Memicu refresh data manual
  const refreshData = () => {
    fetchAllPlants();
  };

  // Ambil data saat mount atau login
  useEffect(() => {
    fetchAllPlants();
  }, [isAuthenticated]);

  // Tambah data tanaman
  const addPlant = async (newPlantData) => {
    if (!isAuthenticated) return false;

    try {
      const plantWithUserId = { ...newPlantData, user_id: session.user.id };

      const { data, error } = await supabase
        .from('plants')
        .insert(plantWithUserId)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setPlants(prev => [data, ...prev]);
        // ✅ Pemanggilan refreshTotalPlantsCount sudah benar
        refreshTotalPlantsCount(); 
      }

      return true;
    } catch (error) {
      console.error('Error adding plant:', error);
      return false;
    }
  };

  // Hapus data tanaman
  const deletePlant = async (plantId) => {
    if (!isAuthenticated) return false;

    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plantId);

      if (error) throw error;

      setPlants((prevPlants) => prevPlants.filter((p) => p.id !== plantId));
      setSelectedPlant(null);
      // ✅ Pemanggilan refreshTotalPlantsCount sudah benar
      refreshTotalPlantsCount();

      return true;
    } catch (error) {
      console.error('Error deleting plant:', error);
      return false;
    }
  };

  // Perbarui data tanaman
  const updatePlant = async (plantId, updates) => {
    if (!isAuthenticated || !plantId) {
      console.error('Update failed: User not authenticated or plantId missing.');
      return false;
    }

    try {
      const { data: updatedData, error } = await supabase
        .from('plants')
        .update(updates)
        .eq('id', plantId)
        .select()
        .single();

      if (error) throw error;

      setPlants((prevPlants) =>
        prevPlants.map((p) =>
          p.id === plantId ? updatedData : p 
        )
      );

      setSelectedPlant((prev) =>
        prev ? updatedData : null 
      );

      return true;
    } catch (error) {
      console.error('Error in updatePlant:', error);
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