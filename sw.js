// 筋LOG -キロク- Service Worker
// バージョンを上げるとキャッシュが更新される
const CACHE_VERSION = 'kinlog-v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}`;

// キャッシュ対象のファイル一覧
const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-120.png',
  './icons/icon-152.png',
  './icons/icon-167.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/favicon.png'
];

// インストール時：必要なファイルを全部キャッシュに保存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 起動時：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// リクエスト時：キャッシュ優先 → なければネットワーク
// アプリ本体（HTML）はネットワーク優先で更新を反映しやすくする
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // index.html へのリクエストはネットワーク優先（更新を即座に反映）
  if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 取得できたらキャッシュも更新
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // その他はキャッシュ優先
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
