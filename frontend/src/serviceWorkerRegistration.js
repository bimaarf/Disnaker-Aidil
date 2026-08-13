// const isLocalhost = Boolean(
//   window.location.hostname === "localhost" ||
//     window.location.hostname === "[::1]" ||
//     window.location.hostname.match(/^127(?:\.[0-9]+){3}$/)
// );

// export function register(config) {
//   if ("serviceWorker" in navigator) {
//     window.addEventListener("load", () => {
//       const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

//       if (isLocalhost) {
//         // Optionally check if service worker exists
//         checkValidServiceWorker(swUrl, config);
//       } else {
//         // Register service worker
//         navigator.serviceWorker
//           .register(swUrl)
//           .then((registration) => {
//             console.log("Service Worker registered:", registration);
//             if (config) {
//               registration.onupdateavailable = () => {
//                 if (config.onUpdate) {
//                   config.onUpdate(registration);
//                 }
//               };
//               registration.onupdatefound = () => {
//                 const installingWorker = registration.installing;
//                 if (installingWorker == null) {
//                   return;
//                 }
//                 installingWorker.onstatechange = () => {
//                   if (installingWorker.state === "installed") {
//                     if (navigator.serviceWorker.controller) {
//                       console.log("New content is available; please refresh.");
//                       if (config.onUpdate) {
//                         config.onUpdate(registration);
//                       }
//                     } else {
//                       console.log("Content is cached for offline use.");
//                       if (config.onSuccess) {
//                         config.onSuccess(registration);
//                       }
//                     }
//                   }
//                 };
//               };
//             }
//           })
//           .catch((error) => {
//             console.error("Service Worker registration failed:", error);
//           });
//       }
//     });
//   }
// }

// export function unregister() {
//   if ("serviceWorker" in navigator) {
//     navigator.serviceWorker.ready
//       .then((registration) => {
//         registration.unregister();
//       })
//       .catch((error) => {
//         console.error("Error during service worker unregistration:", error);
//       });
//   }
// }

// function checkValidServiceWorker(swUrl, config) {
//   fetch(swUrl)
//     .then((response) => {
//       const contentType = response.headers.get("content-type");
//       if (
//         response.status === 404 ||
//         (contentType != null && contentType.indexOf("javascript") === -1)
//       ) {
//         navigator.serviceWorker.ready.then((registration) => {
//           registration.unregister().then(() => {
//             window.location.reload();
//           });
//         });
//       } else {
//         // Optionally register valid service worker
//         registerValidSW(swUrl, config);
//       }
//     })
//     .catch(() => {
//       console.log("No internet connection found. App is running in offline mode.");
//     });
// }

// function registerValidSW(swUrl, config) {
//   navigator.serviceWorker
//     .register(swUrl)
//     .then((registration) => {
//       registration.onupdateavailable = () => {
//         if (config && config.onUpdate) {
//           config.onUpdate(registration);
//         }
//       };
//       registration.onupdatefound = () => {
//         const installingWorker = registration.installing;
//         if (installingWorker == null) {
//           return;
//         }
//         installingWorker.onstatechange = () => {
//           if (installingWorker.state === "installed") {
//             if (navigator.serviceWorker.controller) {
//               console.log("New content is available; please refresh.");
//               if (config && config.onUpdate) {
//                 config.onUpdate(registration);
//               }
//             } else {
//               console.log("Content is cached for offline use.");
//               if (config && config.onSuccess) {
//                 config.onSuccess(registration);
//               }
//             }
//           }
//         };
//       };
//     })
//     .catch((error) => {
//       console.error("Error during service worker registration:", error);
//     });
// }
