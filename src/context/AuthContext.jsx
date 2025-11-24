import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';
import { Leaf, RefreshCw } from 'lucide-react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [totalPlants, setTotalPlants] = useState(0);
  const [loading, setLoading] = useState(true);

  // === Fetch Helpers ===
  const fetchProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, bio')
        .eq('id', userId)
        .single();

      setProfile(data || null);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchTotalPlants = async (userId) => {
    try {
      const { count } = await supabase
        .from('plants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return count || 0;
    } catch (err) {
      return 0;
    }
  };

  const refreshTotalPlantsCount = async () => {
    if (session) {
      const count = await fetchTotalPlants(session.user.id);
      setTotalPlants(count);
    }
  };

  // INIT SESSION DENGAN TIMEOUT PENGAMAN
  useEffect(() => {
    let mounted = true;

    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn("Session check timeout - memaksa aplikasi berjalan.");
        setLoading(false);
      }
    }, 5000);

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted) {
          setSession(session);

          if (session) {
            fetchProfile(session.user.id);
            fetchTotalPlants(session.user.id).then(count => setTotalPlants(count));
          }
        }
      } catch (error) {
        console.error("Session error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setLoading(false);

          if (newSession) {
            fetchProfile(newSession.user.id);
            fetchTotalPlants(newSession.user.id).then(count => setTotalPlants(count));
          } else {
            setProfile(null);
            setTotalPlants(0);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session) {
      await fetchProfile(session.user.id);
    }
  };

  const userVisual = session
    ? {
        id: session.user.id,
        email: session.user.email,
        name: profile?.full_name || session.user.email.split('@')[0],
        avatar:
          profile?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
        bio: profile?.bio,
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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Loading Screen
export const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 p-4 text-center">
    <Leaf className="text-green-600 animate-pulse mb-4" size={48} />
    <p className="text-gray-600 font-medium mb-6">Memuat PlantPal...</p>

    <button
      onClick={() => window.location.reload()}
      className="flex items-center gap-2 text-sm text-gray-400 hover:text-green-600 transition-colors border border-gray-200 px-4 py-2 rounded-full"
    >
      <RefreshCw size={14} />
      Macet? Klik untuk refresh
    </button>
  </div>
);