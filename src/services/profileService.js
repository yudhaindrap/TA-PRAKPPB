import { supabase } from '../supabaseClient';

/**
 * Service untuk menangani operasi profil pengguna
 */

/**
 * Mengambil profil pengguna dari database
 * @param {string} userId - ID pengguna dari auth
 * @returns {Promise<Object|null>} Data profil atau null
 */
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Jika profil belum ada, bukan error
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

/**
 * Membuat profil pengguna baru
 * @param {string} userId - ID pengguna dari auth
 * @param {Object} profileData - Data profil {display_name, bio, profile_photo_url}
 * @returns {Promise<Object>} Data profil yang dibuat
 */
export const createUserProfile = async (userId, profileData = {}) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: userId,
          display_name: profileData.display_name || null,
          bio: profileData.bio || null,
          profile_photo_url: profileData.profile_photo_url || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Memperbarui profil pengguna
 * @param {string} userId - ID pengguna dari auth
 * @param {Object} updates - Data yang akan diupdate {display_name, bio, profile_photo_url}
 * @returns {Promise<Object>} Data profil yang diupdate
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload foto profil ke Supabase Storage
 * @param {string} userId - ID pengguna
 * @param {File} file - File foto yang akan diupload
 * @returns {Promise<string>} URL public foto yang diupload
 */
export const uploadProfilePhoto = async (userId, file) => {
  try {
    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipe file tidak didukung. Gunakan JPEG atau PNG.');
    }

    // Validasi ukuran file (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      throw new Error('Ukuran file terlalu besar. Maksimal 2MB.');
    }

    // Buat nama file unik
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload ke Supabase Storage
    const { error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Dapatkan URL public
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
};

/**
 * Hapus foto profil lama dari storage
 * @param {string} photoUrl - URL foto yang akan dihapus
 * @returns {Promise<void>}
 */
export const deleteProfilePhoto = async (photoUrl) => {
  try {
    if (!photoUrl || photoUrl.includes('dicebear.com')) {
      // Skip jika URL kosong atau menggunakan avatar default
      return;
    }

    // Extract path dari URL
    const urlParts = photoUrl.split('/profile-photos/');
    if (urlParts.length < 2) return;

    const filePath = urlParts[1];

    // Hapus dari storage
    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting old photo:', error);
      // Tidak throw error karena ini non-critical
    }
  } catch (error) {
    console.error('Error in deleteProfilePhoto:', error);
    // Tidak throw error karena ini non-critical
  }
};

/**
 * Update profil lengkap (dengan upload foto jika ada)
 * @param {string} userId - ID pengguna
 * @param {Object} profileData - {display_name, bio}
 * @param {File|null} photoFile - File foto baru (opsional)
 * @param {string|null} oldPhotoUrl - URL foto lama untuk dihapus
 * @returns {Promise<Object>} Data profil yang diupdate
 */
export const updateCompleteProfile = async (userId, profileData, photoFile = null, oldPhotoUrl = null) => {
  try {
    let photoUrl = oldPhotoUrl;

    // Jika ada foto baru, upload dulu
    if (photoFile) {
      // Hapus foto lama jika ada
      if (oldPhotoUrl) {
        await deleteProfilePhoto(oldPhotoUrl);
      }

      // Upload foto baru
      photoUrl = await uploadProfilePhoto(userId, photoFile);
    }

    // Update profil di database
    const updates = {
      ...profileData,
      ...(photoUrl && { profile_photo_url: photoUrl }),
    };

    return await updateUserProfile(userId, updates);
  } catch (error) {
    console.error('Error in updateCompleteProfile:', error);
    throw error;
  }
};
