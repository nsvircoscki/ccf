import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// /api -> backend (porta 3000), igual ao proxy reverso de produção. Assim o
// celular abre o site e fala com a API pelo mesmo endereço (rede local ou
// túnel HTTPS), sem expor a porta 3000.
const servidorLocal = {
  host: true,
  // Túneis de teste: Cloudflare (trycloudflare.com) e Tailscale (ts.net).
  allowedHosts: ['.trycloudflare.com', '.ts.net'],
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true, xfwd: true, rewrite: (caminho) => caminho.replace(/^\/api/, '') },
  },
}

// https://vite.dev/config/
export default defineConfig({
  server: servidorLocal,
  preview: servidorLocal,
  plugins: [
    react(),
    tailwindcss(),
    // PWA pra tela de ponto abrir sem rede. O service worker só guarda o
    // "esqueleto" do app (JS/CSS/HTML/ícones); dados da API nunca são
    // cacheados — as batidas offline ficam no IndexedDB (services/pontoOffline.js).
    // Service worker só funciona em HTTPS (ou localhost): ver readme, "Deploy com HTTPS".
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['ccf_icon.png'],
      manifest: {
        name: 'SIS CCF',
        short_name: 'CCF Ponto',
        description: 'Sistema CCF — registro de ponto funciona mesmo sem internet.',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#f8fafc',
        theme_color: '#1767e8',
        icons: [{ src: '/ccf_icon.png', sizes: '183x235', type: 'image/png', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        // O bundle principal passa dos 2 MB padrão (xlsx, exceljs, leaflet);
        // sem isso ele ficaria fora do cache e o app não abriria offline.
        maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Em produção a API fica em /api (proxy reverso): nunca responder
        // uma navegação pra lá com o index.html do cache.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [{
          urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
          handler: 'CacheFirst',
          options: { cacheName: 'google-fonts', expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 3600 } },
        }],
      },
    }),
  ],
})
