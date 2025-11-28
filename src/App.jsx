import React, { Suspense, lazy } from 'react'; // <-- Import Suspense dan lazy

// Contexts
import { AuthProvider, useAuth, LoadingScreen } from './context/AuthContext';
import { PlantDataProvider } from './context/PlantDataContext';

// Components & Screens - Ubah import ke lazy
// import AuthScreen from './components/AuthScreen';  <-- Hapus
// import AppLayout from './components/AppLayout';    <-- Hapus

const AuthScreen = lazy(() => import('./components/AuthScreen'));
const AppLayout = lazy(() => import('./components/AppLayout'));

// Main Application Component
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    // Bungkus semua conditional rendering dengan Suspense
    <Suspense fallback={<LoadingScreen />}>
      {/* Routing Sederhana */}
      {isAuthenticated ? (
        // Memastikan tata letak responsif tetap di tengah layar
        <div className="bg-gray-100 min-h-screen flex justify-center items-start md:items-center">
          {/* Jika sudah login, berikan akses data dan tampilkan layout utama */}
          <PlantDataProvider>
            <AppLayout />
          </PlantDataProvider>
        </div>
      ) : (
        <AuthScreen />
      )}
    </Suspense>
  );
};

// Root Component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;