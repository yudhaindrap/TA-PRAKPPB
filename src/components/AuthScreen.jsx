import React, { useState } from 'react';
import { Leaf, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient'; // <-- PERBAIKAN JALUR IMPORT

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState('');

  // Fungsi untuk mereset semua state form
  const resetFormStates = (newSignUpState = isSignUp) => {
    setEmail('');
    setPassword('');
    setMessage('');
    setIsSignUp(newSignUpState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    let error;

    if (isSignUp) {
      // 1. Pendaftaran (Sign Up)
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      error = signUpError;

      if (!signUpError) {
        // Logika Sign Out paksa: User didaftarkan tetapi sesi langsung diakhiri 
        // agar user kembali ke halaman Login (SignUp Berhasil).
        await supabase.auth.signOut(); 

        setMessage('Pendaftaran berhasil! Silakan masuk menggunakan email dan password Anda.');
        resetFormStates(false); // Pindah ke mode Login
        setLoading(false);
        return;
      }
    } else {
      // 2. Login (Sign In)
      ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      // Jika login berhasil, AuthContext akan otomatis mendeteksi sesi.
    }

    // Penanganan Error
    if (error) {
      // Supabase error handling
      setMessage(`Gagal: ${error.message}`);
    } 
    
    setLoading(false);
  };
  
  // Teks Dinamis
  const title = isSignUp ? 'Buat Akun PlantPal' : 'PlantPal';
  const subtitle = isSignUp ? 'Daftar sekarang untuk memulai' : 'Masuk untuk merawat tanamanmu';
  const actionButtonText = isSignUp ? 'Daftar Sekarang' : 'Masuk Sekarang';
  const toggleText = isSignUp ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar sekarang';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-green-50 p-6">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Leaf className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <p className="text-gray-500">{subtitle}</p>
        </div>

        {/* Kotak Pesan Dinamis */}
        {message && (
          <div 
            className={`p-3 rounded-xl text-sm mb-4 font-medium ${message.includes('Gagal') ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-4 rounded-xl border bg-gray-50 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-4 rounded-xl border bg-gray-50 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          
          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center disabled:bg-gray-400"
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : actionButtonText}
          </button>
        </form>

        {/* Link untuk Berpindah antara Login dan Register */}
        <button 
          onClick={() => resetFormStates(!isSignUp)} // Gunakan fungsi resetFormStates
          className="w-full mt-4 text-sm text-green-600 hover:text-green-800 transition-colors font-medium"
        >
          {toggleText}
        </button>
      </div>
    </div>
  );
};

export default AuthScreen;