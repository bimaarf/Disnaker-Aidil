const CACHE_NAME = "disnaker-bengkayang-cache-v1";
const CACHE_URLS = [
  "/offline.html",
  // Jangan cache logo di sini, biarkan dinamis
];

// Install event
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching offline resources");
      return cache.addAll(CACHE_URLS).catch((error) => {
        console.error("[Service Worker] Cache addAll failed:", error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip cache untuk request non-GET
  if (event.request.method !== "GET") {
    return;
  }

  // Skip cache untuk API requests kecuali storage
  if (
    url.pathname.startsWith("/api-yz-v1/api/") ||
    url.pathname.startsWith("/socket") ||
    url.pathname.includes("/socket.io/")
  ) {
    return;
  }

  // Skip cache untuk LiveChat
  if (
    url.hostname.includes("livechatinc.com") ||
    url.hostname.includes("livechat")
  ) {
    return;
  }

  // Cache storage files (logo, images, dll)
  if (url.pathname.startsWith("/api-yz-v1/storage/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // Skip cache untuk external resources (CDN, fonts, etc)
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(event.request).catch(() => {
        console.log("[Service Worker] External resource failed:", url.href);
        return new Response("Offline - External resource unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        });
      })
    );
    return;
  }

  // Network first, fallback to cache untuk root "/"
  if (url.pathname === "/" || url.pathname === "/index.html") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log(
            "[Service Worker] Network failed for root, showing offline page"
          );
          return caches.match("/offline.html");
        })
    );
    return;
  }

  // Network first strategy untuk semua resource lainnya
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        if (response.status === 200) {
          caches
            .open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            })
            .catch((error) => {
              console.error("[Service Worker] Cache put failed:", error);
            });
        }
        return response;
      })
      .catch((error) => {
        console.log(
          "[Service Worker] Fetch failed, checking cache:",
          event.request.url
        );
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log(
              "[Service Worker] Serving from cache:",
              event.request.url
            );
            return cachedResponse;
          }
          console.log(
            "[Service Worker] Resource not in cache, showing offline page"
          );
          return caches.match("/offline.html");
        });
      })
  );
});

// Push event untuk notifikasi
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received");

  let data = {};
  try {
    data = event.data
      ? event.data.json()
      : {
          title: "Disnaker Bengkayang",
          body: "Update baru tersedia",
          tag: "disnaker-update",
          url: "/",
        };
  } catch (error) {
    console.error("[Service Worker] Error parsing push data:", error);
    data = {
      title: "Disnaker Bengkayang",
      body: "Update baru tersedia",
      tag: "disnaker-update",
      url: "/",
    };
  }

  const options = {
    body: data.body || "Update baru tersedia",
    icon:
      data.icon ||
      "https://disnaker.yz-course.com/api-yz-v1/storage/uploads/logo/images/logo.svg",
    badge:
      data.badge ||
      "https://disnaker.yz-course.com/api-yz-v1/storage/uploads/logo/images/logo.svg",
    tag: data.tag || "disnaker-update",
    vibrate: data.vibrate || [200, 100, 50, 100, 200],
    requireInteraction: data.requireInteraction || false,
    renotify: true,
    data: {
      url: data.url || "/",
      timestamp: new Date().toISOString(),
      ...data,
    },
    actions: data.actions || [
      {
        action: "view",
        title: "Lihat Detail",
        icon: "https://disnaker.yz-course.com/api-yz-v1/storage/uploads/logo/images/logo.svg",
      },
      {
        action: "close",
        title: "Tutup",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "Disnaker Bengkayang",
      options
    )
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification clicked:", event.action);

  const notification = event.notification;
  const action = event.action;
  const notificationData = notification.data;

  notification.close();

  if (action === "close") {
    return;
  }

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        const urlToOpen = new URL(
          notificationData.url || "/",
          self.location.origin
        ).href;

        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error(
          "[Service Worker] Error handling notification click:",
          error
        );
      })
  );
});

// Message event untuk komunikasi dengan client
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Message received:", event.data);

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});
