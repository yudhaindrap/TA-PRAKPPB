import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      devOptions: {
        enabled: true // Agar bisa tes PWA di mode localhost/dev
      },
      manifest: {
        name: 'PlantPal - Aplikasi Tanaman',
        short_name: 'PlantPal',
        description: 'Kelola tanaman hias Anda dengan mudah',
        theme_color: '#16a34a', // Warna status bar Android (Green 600)
        background_color: '#ffffff',
        display: 'standalone', // INI KUNCI AGAR URL BAR HILANG
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  // >>> PERBAIKAN DITAMBAHKAN DI SINI <<<
  server: {
    host: '0.0.0.0', // Mengikat server ke semua antarmuka jaringan
    port: 5173      // Port default Vite. Pastikan ini port yang Anda gunakan.
  }
  // >>> AKHIR PERBAIKAN <<<
})