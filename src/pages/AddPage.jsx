import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Loader2, Camera, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { usePlantData } from '../context/PlantDataContext'; // <-- BARU: Import context

// Menerima onSaveSuccess sebagai pengganti navigateTo
const AddPage = ({ userId, onSaveSuccess }) => { 
  const { refreshData } = usePlantData(); // <-- BARU: Ambil fungsi refresh
  
  const [plantName, setPlantName] = useState('');
  const [location, setLocation] = useState('Indoor');
  const [species, setSpecies] = useState('');
  
  // State untuk Image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fungsi Handle Pilih Gambar
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Preview lokal sebelum upload
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let publicUrl = 'https://placehold.co/600x400?text=No+Image';

      // 1. Proses Upload Gambar ke Supabase Storage
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`; // Nama file unik pakai timestamp
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('plant-images')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // 2. Ambil URL Publik Gambar
        const { data: urlData } = supabase.storage
          .from('plant-images')
          .getPublicUrl(filePath);
        
        publicUrl = urlData.publicUrl;
      }

      // 3. Simpan Data ke Database
      const { error } = await supabase
        .from('plants')
        .insert([{
          user_id: userId,
          name: plantName,
          species: species,
          location: location,
          image_url: publicUrl,
          needsWater: false 
        }]);

      if (error) throw error;

      setMessage('Berhasil disimpan!');
      
      // 4. Panggil refreshData() setelah berhasil menyimpan
      refreshData(); // <-- FIX: Memicu pengambilan ulang data di PlantDataContext
      
      // Reset Form
      setPlantName('');
      setImageFile(null);
      setImagePreview(null);
      
      // Panggil fungsi sukses untuk pindah ke Home
      setTimeout(() => onSaveSuccess(), 1000); 

    } catch (error) {
      setMessage(`Gagal: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="px-6 pt-12 pb-24"
    >
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Tambah Tanaman</h1>
      
      {message && (
        <div className={`p-4 rounded-xl text-sm mb-4 mt-4 font-medium ${message.includes('Gagal') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}
      
      <form className="space-y-5 mt-4" onSubmit={handleSubmit}>
        
        {/* Input File Custom */}
        <div className="relative w-full h-52 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center overflow-hidden group hover:border-green-400 transition-colors">
          
          {imagePreview ? (
            <>
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-white p-1 rounded-full text-red-500 shadow-md"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                <Camera size={32} className="text-gray-400 group-hover:text-green-500" />
              </div>
              <p className="text-sm font-medium text-gray-500">Ketuk untuk upload foto</p>
              <p className="text-xs text-gray-400 mt-1">(Maks. 2MB)</p>
            </>
          )}

          <input 
            type="file" 
            accept="image/*"
            onChange={handleImageChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nama Tanaman</label>
            <input 
              type="text" value={plantName} onChange={(e) => setPlantName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-green-500 outline-none" 
              placeholder="Contoh: Si Monstera" required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Spesies</label>
            <input 
              type="text" value={species} onChange={(e) => setSpecies(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-green-500 outline-none" 
              placeholder="Contoh: Araceae" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Lokasi</label>
              <select 
                value={location} 
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-xl p-4 focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option>Indoor</option>
                <option>Outdoor</option>
                <option>Kamar Tidur</option>
                <option>Ruang Tamu</option>
                <option>Kantor / Workspace</option>
                <option>Dapur</option>
                <option>Teras Rumah</option>
                <option>Area Belakang Rumah</option>
              </select>
          </div>
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 flex items-center justify-center mt-8 disabled:bg-gray-400"
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2" />}
          Simpan Tanaman
        </button>
      </form>
    </motion.div>
  );
};

export default AddPage;