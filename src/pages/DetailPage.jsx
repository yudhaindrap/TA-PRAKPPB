import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Trash2, Droplet, CheckCircle, Clock, Loader2, Edit, X, Link, UploadCloud, Plus, Bell } from 'lucide-react';
import { usePlantData } from '../context/PlantDataContext';

// 1. Komponen Modal Fullscreen (Tetap sama)
const ImageFullscreenModal = ({ imageUrl, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 bg-[rgba(0,0,0,0.9)] flex items-center justify-center z-[80] p-4"
    onClick={onClose}
  >
    <motion.img
      initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
      src={imageUrl}
      className="max-w-full max-h-full rounded-xl shadow-xl object-contain"
      onClick={(e) => e.stopPropagation()}
    />
    <button onClick={onClose} className="absolute top-4 right-4 text-white bg-gray-800 p-2 rounded-full">
      <X size={28} />
    </button>
  </motion.div>
);

// Utility Format Tanggal
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return isNaN(date) ? 'Belum pernah disiram' : date.toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
};

// 2. Modifikasi Edit Plant Modal (Tambah Input Jadwal) ---
const EditPlantModal = ({ plant, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: plant.name || '',
    species: plant.species || '',
    location: plant.location || '',
    image_url: plant.image_url || '',
    watering_schedule: plant.watering_schedule || [] // Array jam, misal ["07:00", "16:00"]
  });

  const [isSaving, setIsSaving] = useState(false);
  const isBase64 = plant.image_url && plant.image_url.startsWith('data:image/');
  const [imageInputType, setImageInputType] = useState(isBase64 ? 'file' : 'url');
  const [previewUrl, setPreviewUrl] = useState(plant.image_url || null);

  // State untuk input jam baru
  const [newTime, setNewTime] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handler Tambah Jam
  const addSchedule = () => {
    if (newTime && !formData.watering_schedule.includes(newTime)) {
      setFormData(prev => ({
        ...prev,
        watering_schedule: [...prev.watering_schedule, newTime].sort()
      }));
      setNewTime('');
    }
  };

  // Handler Hapus Jam
  const removeSchedule = (timeToRemove) => {
    setFormData(prev => ({
      ...prev,
      watering_schedule: prev.watering_schedule.filter(t => t !== timeToRemove)
    }));
  };

  // (Handler Image sama seperti sebelumnya, disingkat agar fokus ke fitur baru) ...
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
         setPreviewUrl(reader.result);
         setFormData(prev => ({ ...prev, image_url: reader.result }));
       };
       reader.readAsDataURL(file);
    }
  };
  
  const handleImageInputTypeChange = (type) => setImageInputType(type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Kirim data termasuk watering_schedule
    await onSave(formData);
    setIsSaving(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[rgba(0,0,0,0.9)] flex items-center justify-center p-6 z-[70]"
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="bg-white p-6 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6 border-b pb-3">
          <h3 className="text-xl font-bold text-gray-800">Edit Tanaman</h3>
          <button onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Input Nama, Spesies, Lokasi (Tetap Sama) */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nama</label>
            <input name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Spesies</label>
             <input name="species" value={formData.species} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700">Lokasi</label>
             <select name="location" value={formData.location} onChange={handleChange} className="w-full p-2 border rounded-lg bg-white">
                <option value="">Pilih Lokasi</option>
                <option value="Indoor">Indoor</option>
                <option value="Teras">Teras</option>
                <option value="Kebun">Kebun</option>
             </select>
          </div>

          {/* FITUR BARU: JADWAL PENYIRAMAN */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <label className="block text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
               <Clock size={16}/> Jadwal Alarm Penyiraman
            </label>
            
            <div className="flex gap-2 mb-3">
              <input 
                type="time" 
                value={newTime} 
                onChange={(e) => setNewTime(e.target.value)}
                className="p-2 border rounded-lg flex-1"
              />
              <button 
                type="button" 
                onClick={addSchedule}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
              >
                <Plus size={20}/>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.watering_schedule.length === 0 && <span className="text-xs text-gray-400 italic">Belum ada jadwal</span>}
              {formData.watering_schedule.map((time, index) => (
                <span key={index} className="bg-white border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {time}
                  <button type="button" onClick={() => removeSchedule(time)} className="text-red-400 hover:text-red-600">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          {/* ====================================== */}

          {/* Bagian Gambar (Sederhana untuk mempersingkat kode tampilan) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gambar URL / Upload</label>
             {/* Toggle logic same as original... */}
             <div className="flex gap-2 mb-2">
                <button type="button" onClick={() => handleImageInputTypeChange('url')} className={`text-xs px-2 py-1 rounded ${imageInputType==='url' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>URL</button>
                <button type="button" onClick={() => handleImageInputTypeChange('file')} className={`text-xs px-2 py-1 rounded ${imageInputType==='file' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>Upload</button>
             </div>
             {imageInputType === 'url' ? (
               <input name="image_url" value={formData.image_url || ''} onChange={handleChange} className="w-full p-2 border rounded-lg text-sm" placeholder="https://..." />
             ) : (
               <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm" />
             )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100">Batal</button>
            <button type="submit" disabled={isSaving} className="px-6 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 flex items-center">
              {isSaving ? <Loader2 size={16} className="animate-spin mr-2" /> : <CheckCircle size={16} className="mr-2" />} Simpan
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

// 3. Main Detail Page dengan Logic Alarm
const DetailPage = ({ plant, onBack }) => {
  const { deletePlant, updatePlant, handleBack } = usePlantData();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [message, setMessage] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);

  // Minta izin notifikasi browser saat halaman dibuka
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // LOGIC ALARM / PENJADWALAN
  useEffect(() => {
    // Fungsi pengecekan waktu
    const checkSchedule = () => {
      if (!plant.watering_schedule || plant.watering_schedule.length === 0) return;

      const now = new Date();
      const currentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'); // Format HH:MM
      
      // Cek apakah waktu sekarang ada di jadwal
      if (plant.watering_schedule.includes(currentTime)) {
        // Cek apakah SUDAH disiram dalam 1 jam terakhir (untuk mencegah spam notifikasi di menit yang sama)
        const lastWatered = new Date(plant.last_watered_at);
        const isWateredToday = lastWatered.toDateString() === now.toDateString();
        
        // Logic: Jika belum disiram hari ini ATAU status masih false, maka picu alarm
        if (!plant.needsWater) {
           // Trigger Update State ke 'Butuh Air'
           updatePlant(plant.id, { needsWater: true });
           
           // Trigger Browser Notification
           if (Notification.permission === "granted") {
             new Notification(`Waktunya menyiram ${plant.name}!`, {
               body: `Jadwal penyiraman pukul ${currentTime} telah tiba.`,
               icon: '/icon-leaf.png' // Ganti dengan icon app anda
             });
           }
        }
      }
    };

    // Jalankan pengecekan setiap 30 detik
    const timer = setInterval(checkSchedule, 30000);
    return () => clearInterval(timer);
  }, [plant, updatePlant]);

  const handleDelete = async () => {
    setIsDeleting(true);
    const success = await deletePlant(plant.id);
    if (!success) { setMessage('Gagal menghapus.'); setIsDeleting(false); setShowConfirm(false); }
  };

  // Logic Tombol Siram
  const handleWaterUpdate = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    // Jika sedang "Butuh Air" (kuning), user klik -> jadi "Sudah Disiram" (hijau)
    // Jika sedang "Sudah Disiram" (hijau), user klik -> jadi "Butuh Air" (manual override)
    const newWaterStatus = !plant.needsWater; 
    
    const updates = { needsWater: newWaterStatus };
    
    // Jika disiram (jadi false/hijau), update timestamp
    if (newWaterStatus === false) {
      updates.last_watered_at = new Date().toISOString();
    }

    const success = await updatePlant(plant.id, updates);
    
    if (success) {
      setMessage(newWaterStatus ? 'Status diubah: Perlu Air' : 'Tanaman berhasil disiram! 🌱');
      setTimeout(() => setMessage(''), 3000);
    }
    setIsUpdating(false);
  };
  
  const handleGeneralUpdate = async (updates) => {
    setIsUpdating(true);
    const success = await updatePlant(plant.id, updates);
    if (success) {
      setMessage('Data berhasil diperbarui!');
      setTimeout(() => setMessage(''), 3000);
    }
    setIsUpdating(false);
  };

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute inset-0 bg-white z-50 overflow-y-auto"
    >
      <header className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between z-10 shadow-sm">
        <button onClick={handleBack} className="text-gray-600 p-2 rounded-full hover:bg-gray-100"><ChevronLeft size={24} /></button>
        <h1 className="text-lg font-bold truncate max-w-[50%]">{plant.name}</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowEditModal(true)} className="text-blue-500 p-2 rounded-full hover:bg-blue-50"><Edit size={20} /></button>
          <button onClick={() => setShowConfirm(true)} className="text-red-500 p-2 rounded-full hover:bg-red-50"><Trash2 size={24} /></button>
        </div>
      </header>
      
      <div className="w-full h-64 overflow-hidden bg-gray-200 relative">
        <img 
          src={plant.image_url || 'https://placehold.co/600x400/ADF7B6/4F8A10?text=Plant+Image'} 
          alt={plant.name} 
          className="w-full h-full object-cover cursor-pointer" 
          onClick={() => setShowImageModal(true)}
        />
        {/* Overlay Status Air di Gambar */}
        {plant.needsWater && (
           <div className="absolute bottom-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg animate-bounce">
             <Droplet size={12} fill="currentColor" /> BUTUH AIR
           </div>
        )}
      </div>

      <main className="p-6">
        {message && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl text-sm mb-4 font-medium bg-green-100 text-green-700">
            {message}
          </motion.div>
        )}
        
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
           <div className="bg-gray-50 p-3 rounded-xl">
             <span className="text-xs text-gray-500">Spesies</span>
             <p className="font-semibold text-gray-800">{plant.species || '-'}</p>
           </div>
           <div className="bg-gray-50 p-3 rounded-xl">
             <span className="text-xs text-gray-500">Lokasi</span>
             <p className="font-semibold text-gray-800">{plant.location || '-'}</p>
           </div>
        </div>

        {/* AREA UTAMA: STATUS AIR & TOMBOL*/}
        <div className={`p-5 rounded-2xl border-2 transition-all shadow-sm mb-6 ${plant.needsWater ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-400'}`}>
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <div className={`p-3 rounded-full ${plant.needsWater ? 'bg-yellow-200 text-yellow-700' : 'bg-green-200 text-green-700'}`}>
                 {plant.needsWater ? <Bell size={24} className="animate-pulse" /> : <CheckCircle size={24} />}
               </div>
               <div>
                 <h2 className={`text-lg font-bold ${plant.needsWater ? 'text-yellow-800' : 'text-green-800'}`}>
                   {plant.needsWater ? 'Waktunya Menyiram!' : 'Tanaman Sehat'}
                 </h2>
                 <p className="text-xs text-gray-600">
                   {plant.needsWater ? 'Tanaman ini haus, segera siram.' : 'Kelembapan tanah terjaga.'}
                 </p>
               </div>
             </div>
          </div>

          {/* Tombol Aksi Besar */}
          <button 
            onClick={handleWaterUpdate} 
            disabled={isUpdating}
            className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-transform active:scale-95 flex justify-center items-center gap-2 ${plant.needsWater ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {isUpdating ? <Loader2 size={20} className="animate-spin" /> : (
              plant.needsWater ? <><Droplet size={20} fill="white"/> Saya Sudah Menyiram</> : <><CheckCircle size={20}/> Tandai Butuh Air</>
            )}
          </button>
          
          {plant.last_watered_at && (
            <p className="text-center text-xs text-gray-500 mt-3 flex justify-center items-center gap-1">
              <Clock size={12} /> Terakhir disiram: {formatTimestamp(plant.last_watered_at)}
            </p>
          )}
        </div>

        {/* Daftar Jadwal */}
        <div className="mb-8">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Clock size={18}/> Jadwal Penyiraman</h3>
          <div className="flex flex-wrap gap-2">
            {!plant.watering_schedule || plant.watering_schedule.length === 0 ? (
               <p className="text-sm text-gray-400 italic">Belum ada jadwal diatur.</p>
            ) : (
              plant.watering_schedule.map((time, idx) => (
                <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-mono border border-blue-100">
                  ⏰ {time}
                </span>
              ))
            )}
          </div>
        </div>

      </main>
      
      {/* Modals */}
      <AnimatePresence>
        {showEditModal && <EditPlantModal plant={plant} onClose={() => setShowEditModal(false)} onSave={handleGeneralUpdate} />}
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[rgba(0,0,0,0.9)] flex items-center justify-center p-6 z-[60]">
            <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white p-6 rounded-2xl w-full max-w-sm">
              <h3 className="text-xl font-bold text-red-600 mb-3">Hapus Tanaman?</h3>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-gray-600">Batal</button>
                <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl">Hapus</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {showImageModal && <ImageFullscreenModal imageUrl={plant.image_url} onClose={() => setShowImageModal(false)} />}
    </motion.div>
  );
};

export default DetailPage;