import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Leaf } from 'lucide-react';
import { getUserProfile, createUserProfile } from '../services/profileService';

const AuthContext = createContext();

// Hook kustom untuk mempermudah penggunaan
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Fungsi untuk load atau create profile
  const loadUserProfile = useCallback(async (userId, userEmail) => {
    setProfileLoading(true);
    try {
      let profile = await getUserProfile(userId);
      
      // Jika profil belum ada, buat profil baru
      if (!profile) {
        const defaultName = userEmail?.split('@')[0] || 'User';
        profile = await createUserProfile(userId, {
          display_name: defaultName,
        });
      }
      
      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fungsi untuk refresh profile
  const refreshUserProfile = useCallback(async () => {
    if (session?.user?.id) {
      await loadUserProfile(session.user.id, session.user.email);
    }
  }, [session, loadUserProfile]);

  // 1. Cek Session saat pertama kali mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        // Load user profile jika ada session
        if (session?.user?.id) {
          await loadUserProfile(session.user.id, session.user.email);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      } finally {
        setLoading(false);
      }
    };
    checkSession();

    // 2. Listener perubahan otentikasi (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setLoading(false);
      
      // Load user profile saat login
      if (newSession?.user?.id) {
        try {
          await loadUserProfile(newSession.user.id, newSession.user.email);
        } catch (error) {
          console.error("Error loading profile on auth change:", error);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  // User Data Visual - gabungkan dengan profile data
  const userVisual = session ? {
    id: session.user.id,
    name: userProfile?.display_name || session.user.email.split('@')[0],
    email: session.user.email,
    avatar: userProfile?.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`,
    bio: userProfile?.bio || '',
    profile: userProfile,
  } : null;

  const value = {
    session,
    userVisual,
    loading: loading || profileLoading,
    handleLogout,
    isAuthenticated: !!session,
    refreshUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Component loading screen sederhana
export const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
    <Leaf className="text-green-600 animate-pulse" size={48} />
    <p className="mt-4 text-gray-600 font-medium">Memuat sesi...</p>
  </div>
);