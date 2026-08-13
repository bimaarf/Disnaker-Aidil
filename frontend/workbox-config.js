module.exports = {
    globDirectory: "build/",
    globPatterns: ["**/*.{js,css,html,png,svg}"],
    swDest: "build/service-worker.js",
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
        },
      },
      {
        urlPattern: ({ request }) =>
          request.destination === "script" || request.destination === "style",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-cache",
        },
      },
    ],
  };
  