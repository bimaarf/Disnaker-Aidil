import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Uses localStorage by default
import authReducer from "./authentication/AuthSlice";
import blogsReducer from "./blog/blogSlice";
import categoryBlogReducer from "./blog/categoryBlogSlice";
import bannerReducer from "./LandingPages/bannerSlice";
import bodyReducer from "./LandingPages/bodySlice";
import contactsReducer from "./LandingPages/contactSlice";
import galleryReducer from "./LandingPages/gallerySlice";
import landingsReducer from "./LandingPages/landingsSlice";
import logosReducer from "./LandingPages/logoSlice";
import operationalReducer from "./LandingPages/operationalSlice";
import routesReducer from "./LandingPages/routesSlice";
import themesReducer from "./LandingPages/themeSlice";
import serviceReducer from "./newNaker/serviceSlice";
import notificationsReducer from "./notifications/notificationSlice";
import roleReducer from "./roles/roleSlice";
import userReducer from "./users/userSlice";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "logos", "blogs", "categoryBlogs", "banners"],
};

const rootReducer = combineReducers({
  auth: authReducer,
  logos: logosReducer,
  contacts: contactsReducer,
  body: bodyReducer,
  operational: operationalReducer,
  users: userReducer,
  roles: roleReducer,
  routes: routesReducer,
  notifications: notificationsReducer,
  themes: themesReducer,
  blogs: blogsReducer,
  categoryBlogs: categoryBlogReducer,
  gallery: galleryReducer,
  banners: bannerReducer,
  landings: landingsReducer,
  services: serviceReducer,
});

// Create a persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure the store

// Configure the store
// Middleware agar kita bisa dispatch action async dari dalam fulfilled case
const asyncDispatchMiddleware = (store) => (next) => (action) => {
  let syncActivityFinished = false;
  const actionQueue = [];

  const asyncDispatch = (asyncAction) => {
    actionQueue.push(asyncAction);
    if (syncActivityFinished) {
      actionQueue.forEach((a) => store.dispatch(a));
    }
  };

  const actionWithAsyncDispatch = Object.assign({}, action, { asyncDispatch });
  const result = next(actionWithAsyncDispatch);
  syncActivityFinished = true;

  // Eksekusi action di queue setelah activity sync selesai
  while (actionQueue.length > 0) {
    store.dispatch(actionQueue.shift());
  }

  return result;
};

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false, // ✅ matikan immutable check
      serializableCheck: false, // opsional, biar lebih ringan
    }).concat(asyncDispatchMiddleware),
});

// Create the persistor
export const persistor = persistStore(store);
