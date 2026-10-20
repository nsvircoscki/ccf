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
      // 'prompt': versão nova só entra quando a pessoa toca em "Atualizar"
      // (components/AvisoNovaVersao.jsx, que também registra o service worker)
      // — nunca recarrega no meio de uma batida nem prende ninguém numa versão
      // quebrada sem aviso.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['ccf_icon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'SIS CCF',
        short_name: 'CCF Ponto',
        description: 'Sistema CCF — registro de ponto funciona mesmo sem internet.',
        lang: 'pt-BR',
        id: '/',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f8fafc',
        theme_color: '#1767e8',
        // Quadrados, como o Android pede para oferecer "Instalar app".
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
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
