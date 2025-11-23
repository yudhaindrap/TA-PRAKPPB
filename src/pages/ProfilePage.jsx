import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Heart, Edit2, Camera, Save, X, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateCompleteProfile } from '../services/profileService';

const ProfilePage = ({ user, onLogout }) => {
  const { refreshUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [displayName, setDisplayName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [previewImage, setPreviewImage] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi ukuran
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimal 2MB.');
      return;
    }

    // Validasi tipe
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Tipe file tidak didukung. Gunakan JPEG atau PNG.');
      return;
    }

    setPhotoFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
    setError('');
  };

  // Handle save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validasi bio length
      if (bio && bio.length > 1000) {
        throw new Error('Bio terlalu panjang. Maksimal 1000 karakter.');
      }

      // Update profile
      await updateCompleteProfile(
        user.id,
        { display_name: displayName, bio },
        photoFile,
        user.avatar
      );

      // Refresh profile data
      await refreshUserProfile();

      setSuccess('Profil berhasil diperbarui!');
      setIsEditing(false);
      setPhotoFile(null);
      setPreviewImage(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Gagal memperbarui profil. Silakan coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setDisplayName(user.name || '');
    setBio(user.bio || '');
    setPhotoFile(null);
    setPreviewImage(null);
    setError('');
    setSuccess('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="pb-24 bg-gray-50 min-h-screen"
    >
      <div className="bg-gray-900 text-white pt-16 pb-12 px-6 rounded-b-[3rem] text-center shadow-2xl relative">
        {/* Edit button - positioned at top right */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          title="Edit Profil"
        >
          {isEditing ? <X size={20} /> : <Edit2 size={20} />}
        </button>

        <motion.div 
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          className="w-28 h-28 bg-gradient-to-tr from-green-400 to-blue-500 rounded-full mx-auto mb-4 p-1 relative"
        >
          <img 
            src={previewImage || user.avatar} 
            alt="Profile" 
            className="w-full h-full rounded-full border-4 border-gray-900 object-cover" 
          />
          {isEditing && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-green-600 rounded-full shadow-lg hover:bg-green-700 transition-colors"
              title="Ganti Foto"
            >
              <Camera size={16} />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload foto profil"
          />
        </motion.div>
        
        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full text-2xl font-bold bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center focus:outline-none focus:border-green-400 transition-colors"
              placeholder="Nama Anda"
              required
            />
            <p className="text-gray-400 text-sm font-mono">{user.email}</p>
          </form>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-gray-400 text-sm font-mono">{user.email}</p>
          </>
        )}
      </div>

      <div className="px-6 -mt-8">
        {/* Success/Error Messages */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-50 text-green-700 p-3 rounded-xl border border-green-200 mb-4 text-sm font-medium text-center"
            >
              {success}
            </motion.div>
          )}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 mb-4 text-sm font-medium text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bio Section */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
          {isEditing ? (
            <form onSubmit={handleSaveProfile}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all resize-none"
                placeholder="Ceritakan tentang diri Anda..."
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {bio.length}/1000 karakter
              </p>
              
              <div className="flex gap-3 mt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-green-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Simpan Profil
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="px-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </form>
          ) : (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Bio</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {user.bio || 'Belum ada bio. Klik tombol edit untuk menambahkan bio Anda.'}
              </p>
            </div>
          )}
        </div>

        {/* Stats Card */}
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="flex justify-around text-center divide-x divide-gray-100">
            <div>
              <p className="text-2xl font-bold text-green-600">{user.totalPlants || 0}</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Tanaman</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">12</p>
              <p className="text-xs text-gray-400 uppercase tracking-wider mt-1">Log Rawat</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between w-full bg-white p-4 rounded-xl border border-gray-200 text-gray-700">
             <span className="flex items-center gap-3 font-medium">
                <Heart size={20} className="text-red-500" /> Versi Aplikasi
             </span>
             <span className="text-xs bg-gray-100 px-2 py-1 rounded">v1.0.0 PWA</span>
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