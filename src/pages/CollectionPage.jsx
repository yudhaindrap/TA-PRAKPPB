import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, ChevronLeft, ChevronRight, Loader2, Leaf } from 'lucide-react';

// === 1. HOOK DEBOUNCE (Dipercepat ke 300ms) ===
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

const ITEMS_PER_PAGE = 6;

const CollectionPage = ({ plants, onDetail, onAddPlant }) => {
  const [searchTermInput, setSearchTermInput] = useState('');
  // Kurangi delay ke 300ms agar search terasa lebih responsif tapi tetap hemat resource
  const debouncedSearchTerm = useDebounce(searchTermInput, 300);
  const [currentPage, setCurrentPage] = useState(1);

  // FILTERING 
  const filteredPlants = useMemo(() => {
    const lowerCaseSearchTerm = debouncedSearchTerm.toLowerCase().trim();
    if (!lowerCaseSearchTerm) return plants;
    
    return plants.filter(plant => 
      plant.name.toLowerCase().includes(lowerCaseSearchTerm) ||
      plant.species.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [plants, debouncedSearchTerm]);

  // PAGINATION CALCULATION 
  const totalItems = filteredPlants.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  // Reset halaman saat search berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const paginatedPlants = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPlants.slice(startIndex, endIndex);
  }, [filteredPlants, currentPage]);

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      // OPTIMASI KECEPATAN: Gunakan 'auto' untuk scroll instan, bukan 'smooth'
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const isSearching = searchTermInput !== debouncedSearchTerm;

  // ANIMASI YANG DIPERCEPAT
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.03, // SANGAT CEPAT: 0.03s per item (sebelumnya 0.1s)
        delayChildren: 0.01
      } 
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 }, // Jarak y dikurangi biar lebih cepat
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="px-6 pt-12 pb-32 min-h-screen relative bg-gray-50"
    >
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 leading-tight">
            Koleksi<br/>
            <span className="text-green-600">Tanaman</span>
          </h1>
        </div>
        <span className="bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-500 shadow-sm border border-gray-100">
          {totalItems} Tanaman
        </span>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-6 sticky top-4 z-30">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama tanaman..." 
            value={searchTermInput}
            onChange={(e) => setSearchTermInput(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl p-4 pl-12 text-sm focus:ring-2 focus:ring-green-500/50 outline-none shadow-sm transition-all focus:shadow-md"
          />
          
          {isSearching ? (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
               <Loader2 className="text-green-500 animate-spin" size={18} />
            </div>
          ) : searchTermInput && (
            <button 
              onClick={() => setSearchTermInput('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Grid Content */}
      <AnimatePresence mode='wait'>
        <motion.div 
          // Key diubah agar animasi ulang terjadi saat page berubah atau search berubah
          key={currentPage + debouncedSearchTerm}
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-4"
        >
          {paginatedPlants.map(plant => (
            <motion.div 
              key={plant.id} 
              variants={item}
              layout // Properti layout membuat transisi posisi smooth
              onClick={() => onDetail(plant)} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer group active:scale-95 transition-all duration-200"
            >
              <div className="h-36 bg-gray-100 relative overflow-hidden">
                <img 
                  src={plant.image_url || plant.image} 
                  onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/600x400?text=No+Image" }} 
                  alt={plant.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  loading="lazy" // Lazy loading agar render awal cepat
                />
                
                {/* Badge Overlay */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                  {plant.needsWater && (
                    <span className="bg-blue-500/90 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">
                      Haus
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-3">
                <h3 className="font-bold text-gray-800 text-sm truncate mb-0.5">{plant.name}</h3>
                <div className="flex items-center gap-1 text-gray-500">
                  <Leaf size={10} />
                  <p className="text-xs truncate">{plant.species || "Spesies tidak diketahui"}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Empty States */}
      {!isSearching && totalItems === 0 && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-center text-gray-400"
        >
          <Leaf size={48} className="mb-4 opacity-20" />
          <p>{searchTermInput ? "Tidak ditemukan tanaman." : "Belum ada tanaman."}</p>
        </motion.div>
      )}

      {/* PAGINASI CEPAT */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 shadow-sm disabled:opacity-30 disabled:shadow-none hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          
          <span className="text-sm font-bold text-gray-700">
            {currentPage} <span className="text-gray-400 font-normal">/ {totalPages}</span>
          </span>

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 shadow-sm disabled:opacity-30 disabled:shadow-none hover:bg-gray-50 active:scale-95 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default CollectionPage;