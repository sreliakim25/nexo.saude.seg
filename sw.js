/**
 * NEXO · SAÚDE & SANEAMENTO
 * Service Worker para suporte PWA Offline
 * 
 * Este arquivo funciona como um intermediário (proxy) entre a aplicação web e a rede.
 * Ele permite que os arquivos do mockup fiquem salvos no cache do navegador, permitindo
 * que o sistema funcione perfeitamente mesmo sem conexão com a internet (Modo Offline).
 */

const CACHE_NAME = 'nexo-mockup-v1';

// Arquivos que serão armazenados em cache para uso offline
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  // Fontes do Google e scripts CDN são cacheados dinamicamente ao serem acessados
];

// Evento de Instalação: Salva os arquivos estáticos no cache local
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Armazenando recursos estáticos no cache');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Força o service worker ativo a tomar o controle imediatamente
  );
});

// Evento de Ativação: Limpa caches antigos quando houver atualização de versão
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Garante que a aba atual seja controlada imediatamente
  );
});

// Evento de Busca (Fetch): Intercepta requisições de rede
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não HTTP/HTTPS (ex: extensões de navegador)
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Se o arquivo estiver no cache, retorna ele imediatamente (rápido!)
      if (cachedResponse) {
        // Atualiza em segundo plano (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {/* Ignora falha de rede ao revalidar offline */});
          
        return cachedResponse;
      }

      // Caso contrário, busca na rede
      return fetch(event.request).then((networkResponse) => {
        // Salva dinamicamente no cache recursos externos úteis (ex: ApexCharts, Leaflet CDN)
        if (
          networkResponse.status === 200 && 
          (event.request.url.includes('cdn') || event.request.url.includes('unpkg') || event.request.url.includes('googleapis') || event.request.url.includes('gstatic'))
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback offline se a rede falhar e o recurso não estiver no cache
        console.log('[Service Worker] Recurso offline não disponível:', event.request.url);
      });
    })
  );
});
