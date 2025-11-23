import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trash2, Droplet, CheckCircle, Clock, Loader2, Edit, X, Link, UploadCloud } from 'lucide-react'; 
import { usePlantData } from '../context/PlantDataContext';

    const ImageFullscreenModal = ({ imageUrl, onClose }) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-[rgba(0,0,0,0.8)] flex items-center justify-center z-[80] p-4"
        onClick={onClose}
    >
        <motion.img
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        src={imageUrl}
        className="max-w-full max-h-full rounded-xl shadow-xl object-contain"
        onClick={(e) => e.stopPropagation()} 
        />

        <button 
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-70 transition"
        >
        <X size={28} />
        </button>
    </motion.div>
    );

// Utility untuk format tanggal dan waktu
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  if (isNaN(date)) {
    return 'Tanggal tidak valid';
  }
  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// --- Komponen Modal Edit Tanaman ---
const EditPlantModal = ({ plant, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: plant.name || '',
    species: plant.species || '',
    location: plant.location || '',
    image_url: plant.image_url || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const isBase64 = plant.image_url && plant.image_url.startsWith('data:image/');
  const [imageInputType, setImageInputType] = useState(isBase64 ? 'file' : 'url');
  const [previewUrl, setPreviewUrl] = useState(plant.image_url || null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        console.error('Ukuran file terlalu besar. Maksimal 1MB.');
        alert('Ukuran file terlalu besar. Maksimal 1MB.');
        e.target.value = '';
        return;
      }

      setPreviewUrl(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(plant.image_url || null);
      setFormData(prev => ({ ...prev, image_url: plant.image_url || null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const updates = Object.keys(formData).reduce((acc, key) => {
      let currentValue = formData[key];

      if (key === 'image_url') {
        if (imageInputType === 'url' && currentValue === '') {
          currentValue = null;
        }
        if (imageInputType === 'file' && !currentValue) {
          currentValue = plant.image_url || null;
        }
      }

      if (currentValue !== plant[key]) {
        acc[key] = currentValue === '' ? null : currentValue;
      }
      return acc;
    }, {});

    await onSave(updates);
    setIsSaving(false);
    onClose();
  };

  const handleImageInputTypeChange = (type) => {
    setImageInputType(type);
    if (type === 'url') {
      setFormData(prev => ({ ...prev, image_url: plant.image_url && !isBase64 ? plant.image_url : '' }));
      setPreviewUrl(plant.image_url && !isBase64 ? plant.image_url : null);
    } else {
      setFormData(prev => ({ ...prev, image_url: plant.image_url || '' }));
      setPreviewUrl(plant.image_url || null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-[70]"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h3 className="text-2xl font-bold text-gray-800">Edit Tanaman: {plant.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama Tanaman</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500"
              placeholder="Contoh: Bunga Matahari Kecil"
            />
          </div>

          <div>
            <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">Spesies (Nama Ilmiah/Umum)</label>
            <input
              id="species"
              name="species"
              type="text"
              value={formData.species}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500"
              placeholder="Contoh: Helianthus Annuus"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500 appearance-none bg-white"
            >
              <option value="">Pilih Lokasi (Opsional)</option>
              <option value="Indoor">Indoor</option>
              <option value="Teras">Teras</option>
              <option value="Kamar">Kamar</option>
              <option value="Balkon">Balkon</option>
              <option value="Kebun">Kebun</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Tanaman</label>

            <div className="flex border-b mb-3">
              <button
                type="button"
                onClick={() => handleImageInputTypeChange('url')}
                className={`flex items-center gap-2 p-2 px-4 text-sm font-medium transition-colors ${imageInputType === 'url' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Link size={16} /> URL Link
              </button>
              <button
                type="button"
                onClick={() => handleImageInputTypeChange('file')}
                className={`flex items-center gap-2 p-2 px-4 text-sm font-medium transition-colors ${imageInputType === 'file' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <UploadCloud size={16} /> Unggah File
              </button>
            </div>

            {imageInputType === 'url' ? (
              <input
                id="image_url_input"
                name="image_url"
                type="url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-green-500 focus:border-green-500"
                placeholder="https://link-ke-foto-tanaman.jpg"
              />
            ) : (
              <input
                id="file_upload_input"
                name="file_upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-3 border border-gray-300 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            )}

            {previewUrl && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-1">Pratinjau:</p>
                <img 
                  src={previewUrl} 
                  alt="Pratinjau Tanaman" 
                  className="w-24 h-24 object-cover rounded-lg shadow-md" 
                />
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
               {imageInputType === 'file' ? 'Catatan: Untuk unggah file, gambar dikonversi ke Base64 (max 1MB) dan disimpan langsung di database.' : 'Catatan: Gambar akan dimuat dari URL eksternal.'}
            </p>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />}
              Simpan Perubahan
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
// --- Akhir Modal Edit ---


const DetailPage = ({ plant, onBack }) => {
  const { deletePlant, updatePlant, handleBack } = usePlantData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [message, setMessage] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setMessage('');
    
    const success = await deletePlant(plant.id);
    
    if (!success) {
      setMessage('Gagal menghapus tanaman.');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleWaterUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    setMessage('');
    
    const newWaterStatus = !plant.needsWater;
    
    const updates = { 
      needsWater: newWaterStatus,
    };
    
    if (!newWaterStatus) {
      updates.last_watered_at = new Date().toISOString();
    }
    
    const success = await updatePlant(plant.id, updates);

    if (success) {
      setMessage(newWaterStatus ? 'Pengingat air diaktifkan.' : 'Status air disetel menjadi OK!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Gagal memperbarui status air.');
    }
    
    setIsUpdating(false);
  };
  
  const handleGeneralUpdate = async (updates) => {
    if (Object.keys(updates).length === 0) {
      setMessage('Tidak ada perubahan untuk disimpan.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    setIsUpdating(true);
    setMessage('');
    
    const success = await updatePlant(plant.id, updates);

    if (success) {
      setMessage('Informasi tanaman berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('Gagal memperbarui informasi tanaman.');
    }
    
    setIsUpdating(false);
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white z-50 overflow-y-auto"
    >
      <header className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10 shadow-sm">
        <button onClick={handleBack} className="text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold truncate max-w-[50%]">{plant.name}</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowEditModal(true)}
            className="text-blue-500 p-2 rounded-full hover:bg-blue-50 transition-colors"
          >
            <Edit size={20} />
          </button>
          <button 
            onClick={() => setShowConfirm(true)}
            className="text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </header>
      
      <div className="w-full h-64 overflow-hidden bg-gray-200">
        <img 
        src={plant.image_url || 'https://placehold.co/600x400/ADF7B6/4F8A10?text=Plant+Image'} 
        alt={plant.name} 
        className="w-full h-full object-cover cursor-pointer" 
        onClick={() => setShowImageModal(true)}
        onError={(e) => { 
            e.target.onerror = null; 
            e.target.src = 'https://placehold.co/600x400/ADF7B6/4F8A10?text=Plant+Image'; 
        }}
        />
      </div>

      <main className="p-6">
        
        {message && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl text-sm mb-4 font-medium ${message.includes('Gagal') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          >
            {message}
          </motion.div>
        )}
        
        <div className="space-y-4 mb-8">
          <InfoItem label="Nama" value={plant.name || 'Tidak ada'} />
          <InfoItem label="Spesies" value={plant.species || 'Tidak diketahui'} />
          <InfoItem label="Lokasi" value={plant.location || '-'} />
          <InfoItem label="Ditambahkan" value={formatTimestamp(plant.created_at)} />
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4 border-t pt-6">Perawatan Cepat</h2>
        
        <div className={`p-4 rounded-2xl flex items-center justify-between transition-colors shadow-md ${plant.needsWater ? 'bg-yellow-50 border border-yellow-300' : 'bg-green-50 border border-green-300'}`}>
          <div className="flex items-center gap-3">
            {plant.needsWater ? (
              <Droplet size={28} className="text-yellow-600" />
            ) : (
              <CheckCircle size={28} className="text-green-600" />
            )}
            <div>
              <p className="font-bold text-gray-800">Status Air</p>
              <p className={`text-sm ${plant.needsWater ? 'text-yellow-600' : 'text-green-600'}`}>
                {plant.needsWater ? 'Perlu Disiram' : 'Kelembapan Optimal'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleWaterUpdate} 
            disabled={isUpdating}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${plant.needsWater ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {isUpdating ? <Loader2 size={16} className="animate-spin" /> : (plant.needsWater ? 'Baru Disiram' : 'Tandai Perlu Air')}
          </button>
        </div>
        
        {plant.last_watered_at && (
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <Clock size={12} />
            Status air terakhir diperbarui: {formatTimestamp(plant.last_watered_at)}
          </p>
        )}

      </main>
      
      <AnimatePresence>
        {showEditModal && (
          <EditPlantModal 
            plant={plant}
            onClose={() => setShowEditModal(false)}
            onSave={handleGeneralUpdate}
          />
        )}
      </AnimatePresence>
        {showImageModal && (
        <ImageFullscreenModal
        imageUrl={plant.image_url}
        onClose={() => setShowImageModal(false)}
        />
        )}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-[60]"
          >
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <h3 className="text-xl font-bold text-red-600 mb-3">Konfirmasi Hapus</h3>
              <p className="text-gray-600 mb-6">Anda yakin ingin menghapus tanaman **{plant.name}** dari koleksi Anda? Aksi ini tidak dapat dibatalkan.</p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                  disabled={isDeleting}
                >
                  Batal
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors flex items-center disabled:opacity-50"
                  disabled={isDeleting}
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin mr-2" /> : <Trash2 size={16} className="mr-2" />}
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const InfoItem = ({ label, value }) => (
  <div className="flex justify-between border-b border-gray-100 py-2">
    <span className="text-sm font-medium text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-gray-700">{value}</span>
  </div>
);

export default DetailPage;
