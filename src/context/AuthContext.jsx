import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { Leaf } from 'lucide-react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [totalPlants, setTotalPlants] = useState(0); 
  const [loading, setLoading] = useState(true);

  // === Ambil data profil dari tabel 'profiles' ===
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setProfile(data || null);
    } catch (error) {
      console.error('Error fetching profile:', error.message || error);
    }
  };

  // === Ambil total tanaman dari tabel 'plants' ===
  const fetchTotalPlants = async (userId) => {
    try {
      const { count, error } = await supabase
        .from('plants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) throw error;

      return count || 0;
    } catch (err) {
      console.error("Error fetching total plants:", err);
      return 0;
    }
  };

  // === Fungsi khusus untuk me-refresh HANYA jumlah tanaman ===
  // 🛑 PERBAIKAN: Hapus kata kunci 'export' di sini. Fungsi ini diekspos melalui 'value'.
  const refreshTotalPlantsCount = async () => { 
    if (session) {
      const plantsCount = await fetchTotalPlants(session.user.id);
      setTotalPlants(plantsCount);
    }
  };

  // === INIT SESSION ===
  useEffect(() => {
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);

        if (session) {
          // Jalankan query secara PARALEL (cepat)
          await Promise.all([
            fetchProfile(session.user.id),
            (async () => {
              const plantsCount = await fetchTotalPlants(session.user.id);
              setTotalPlants(plantsCount);
            })(),
          ]);
        }
      } catch (error) {
        console.error("Session error:", error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    // Listen perubahan login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);

        if (newSession) {
          await Promise.all([
            fetchProfile(newSession.user.id),
            (async () => {
              const plantsCount = await fetchTotalPlants(newSession.user.id);
              setTotalPlants(plantsCount);
            })(),
          ]);
        } else {
          setProfile(null);
          setTotalPlants(0);
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // === LOGOUT ===
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // === Refresh Profile (dipanggil setelah edit profil) ===
  const refreshProfile = async () => {
    if (session) {
      await fetchProfile(session.user.id); 
    }
  };

  // === Gabungkan data user session + data tabel profiles + total tanaman ===
  const userVisual = session
    ? {
        id: session.user.id,
        email: session.user.email,
        name: profile?.full_name || session.user.email.split('@')[0],
        avatar:
          profile?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
        totalPlants: totalPlants, 
      }
    : null;

  const value = {
    session,
    userVisual,
    loading,
    handleLogout,
    refreshProfile,
    refreshTotalPlantsCount, 
    isAuthenticated: !!session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// === Loading Screen ===
export const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
    <Leaf className="text-green-600 animate-pulse" size={48} />
    <p className="mt-4 text-gray-600 font-medium">Memuat PlantPal...</p>
  </div>
);