import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { LogOut, Edit2, Check, X, Camera, Heart, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';   // Import context untuk refresh

const ProfilePage = ({ user, onLogout }) => {
  const { refreshProfile } = useAuth(); // Ambil fungsi refresh
  
  // === STATE EDIT MODE ===
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false); // State loading saat simpan
  
  const [form, setForm] = useState({
    name: user.name,
    avatar: user.avatar,
  });

  const [previewImg, setPreviewImg] = useState(null); // Untuk preview visual
  const [uploadFile, setUploadFile] = useState(null); // File mentah untuk diupload ke Supabase
  const fileRef = useRef(null);

  // --- Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImagePick = () => {
    if (isEditing) fileRef.current.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran maksimal 2MB");
      return;
    }

    // Simpan file asli untuk diupload nanti
    setUploadFile(file);

    // Buat preview lokal
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImg(reader.result);
      setForm(prev => ({ ...prev, avatar: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // === LOGIKA SIMPAN KE DATABASE ===
  const handleSave = async () => {
    setLoading(true);
    try {
      let finalAvatarUrl = user.avatar;

      // 1. Jika ada file baru, Upload ke Storage bucket 'avatars'
      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, uploadFile);

        if (uploadError) throw uploadError;

        // Dapatkan Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        finalAvatarUrl = publicUrl;
      }

      // 2. Update atau Insert ke tabel 'profiles'
      const updates = {
        id: user.id,
        full_name: form.name,
        avatar_url: finalAvatarUrl,
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      // 3. Refresh data di Context agar UI terupdate otomatis
      await refreshProfile();
      
      setIsEditing(false);
      setUploadFile(null); // Reset file
      setPreviewImg(null); // Reset preview

    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Gagal menyimpan profil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({
      name: user.name,
      avatar: user.avatar,
    });
    setPreviewImg(null);
    setUploadFile(null);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pb-24 bg-gray-50 min-h-screen"
    >
      {/* ==== HEADER AREA ==== */}
      <div className="bg-gray-900 text-white pt-16 pb-12 px-6 rounded-b-[3rem] text-center shadow-2xl relative">

        {/* Tombol Edit / Save */}
        <div className="absolute top-6 right-6 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="p-2 bg-red-500/20 text-red-400 rounded-full hover:bg-red-500/40"
              >
                <X size={20} />
              </button>

              <button
                onClick={handleSave}
                disabled={loading}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 disabled:bg-gray-500"
              >
                {loading ? <Loader2 size={20} className="animate-spin"/> : <Check size={20} />}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20"
            >
              <Edit2 size={20} />
            </button>
          )}
        </div>

        {/* FOTO PROFIL */}
        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-28 h-28 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full mx-auto mb-4 p-1 relative cursor-pointer"
          onClick={handleImagePick}
        >
          <img
            src={previewImg || user.avatar}
            alt="Avatar"
            className={`w-full h-full rounded-full border-4 border-gray-900 object-cover bg-gray-700 ${isEditing ? 'opacity-50' : ''}`}
            onError={(e) => (e.target.src = "https://placehold.co/200")}
          />

          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Camera size={24} className="text-white drop-shadow-md" />
            </div>
          )}
        </motion.div>

        {/* Input file tersembunyi */}
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          className="hidden"
          onChange={handleImageChange}
        />

        {/* NAMA & EMAIL */}
        {isEditing ? (
          <div className="space-y-2 max-w-[200px] mx-auto">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Nama Lengkap"
              className="bg-gray-800 text-white text-center text-xl font-bold rounded-lg p-2 w-full border border-gray-600 focus:border-green-500 focus:outline-none"
            />
            <div className="text-gray-400 text-sm font-mono">{user.email}</div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-400 text-sm font-mono">{user.email}</p>
          </>
        )}
      </div>

      {/* ==== STATISTIK CARD (Mengapung) ==== */}
      <div className="px-6 -mt-10 relative z-[50]">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="flex justify-around text-center divide-x divide-gray-100">
            <div>
              <p className="text-2xl font-bold text-green-600">{user.totalPlants || 0}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Tanaman</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">Active</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Status</p>
            </div>
          </div>
        </div>

        {/* ==== MENU BAWAH ==== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-700">
            <span className="flex items-center gap-3 font-medium">
              <Heart size={20} className="text-red-500" /> Versi Aplikasi
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">v1.0.0</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full bg-red-50 text-red-500 p-4 rounded-xl border border-red-100 font-bold flex items-center justify-center gap-2 mt-6 hover:bg-red-100 transition-colors"
          >
            <LogOut size={20} />
            Keluar Akun
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfilePage;