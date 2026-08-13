import axios from "axios";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";
import { ForgotPassword } from "./Components/forgotPassword.js";
import { LoginPage } from "./Components/loginPage";
import OtpVerification from "./Components/OtpVerification.js";
import { RegisterPage } from "./Components/registerPage";
import ResetPassword from "./Components/ResetPassword.js";
import { SidebarGeneral } from "./Components/SidebarGeneral";

import {
  checkAuth,
  logout,
  selectIsAuthenticated,
  selectToken,
  selectUser,
  updateSingleUser,
} from "./features/authentication/AuthSlice";
import { fetchInitialData } from "./features/LandingPages/logoSlice";
import {
  fetchTheme,
  selectLocalTheme,
} from "./features/LandingPages/themeSlice";
import OfflinePage from "./OfflinePage";
import { About } from "./Pages/About";
import { Blog } from "./Pages/Blog.jsx";
import { Contact } from "./Pages/Contact.jsx";

import { TopBarProvider, useTopBar } from "./Helper/topbarProgressHelper.js";
import ProtectedRoute from "./middleware/protectedRoute.js";
import { Disnaker } from "./Pages/Disnaker.js";
import { Gallery } from "./Pages/Gallery.jsx";
import { Home } from "./Pages/Home.jsx";
import { SidebarGeneral as SidebarGeneralAuth } from "./Pages/Secret/Components/_sidebarGeneral";
import AccountPage from "./Pages/Secret/Content/__account/_accountPage";
import BannerPage from "./Pages/Secret/Content/__banners/__bannerPage.jsx";
import BlogCreatePage from "./Pages/Secret/Content/__blog/__app/_blogCreatePage";
import BlogPreviewHome from "./Pages/Secret/Content/__blog/__app/_blogPreviewHome";
import BlogPreviewPage from "./Pages/Secret/Content/__blog/__app/_blogPreviewPage";
import BlogUpdatePage from "./Pages/Secret/Content/__blog/__app/_blogUpdatePage";
import { BlogPage } from "./Pages/Secret/Content/__blog/_blogPage";
import CategoryBlogCreatePage from "./Pages/Secret/Content/__categoryBlog/__app/_categoryBlogCreate";
import CategoryBlogPreviewPage from "./Pages/Secret/Content/__categoryBlog/__app/_categoryBlogPreviewPage";
import CategoryBlogUpdatePage from "./Pages/Secret/Content/__categoryBlog/__app/_categoryBlogUpdatePage";
import { CategoryBlogPage } from "./Pages/Secret/Content/__categoryBlog/_categoryBlogPage";
import { ContactPage } from "./Pages/Secret/Content/__contact/_contactPage";
import Dashboard from "./Pages/Secret/Content/__dashboard/_dashboard";
import { BodyPage } from "./Pages/Secret/Content/__landing/_bodyPage";
import { OperationalPage } from "./Pages/Secret/Content/__landing/_operationalPage.jsx";
import LandingManagementPage from "./Pages/Secret/Content/__landingPages/_landingManagementPage.jsx";
import NotificationCreatePage from "./Pages/Secret/Content/__notifications/__app/_notificationCreate";
import NotificationPreviewPage from "./Pages/Secret/Content/__notifications/__app/_notificationPreviewPage";
import NotificationUpdatePage from "./Pages/Secret/Content/__notifications/__app/_notificationUpdatePage";
import { NotificationPage } from "./Pages/Secret/Content/__notifications/_notificationPage";
import RoleCreatePage from "./Pages/Secret/Content/__roles/__app/_roleCreate";
import RoleUpdatePage from "./Pages/Secret/Content/__roles/__app/_roleUpdatePage";
import { RolePage } from "./Pages/Secret/Content/__roles/_rolePage";
import ServiceManagementPage from "./Pages/Secret/Content/__services/ServiceManagementPage.jsx";
import UserCreatePage from "./Pages/Secret/Content/__users/__app/_userCreate";
import UserUpdatePage from "./Pages/Secret/Content/__users/__app/_userUpdatePage";
import { UserPage } from "./Pages/Secret/Content/__users/_userPage";

// Axios configuration
axios.defaults.baseURL = process.env.REACT_APP_API;
axios.defaults.headers.post["Accept"] = "application/json";
axios.defaults.headers.post["Access-Control-Allow-Origin"] = "*";
axios.defaults.headers.post["Content-Type"] =
  "application/json/x-www-form-urlencoded; charset=UTF-8; multipart/form-data";
axios.defaults.withCredentials = true;

// Add token to every request
axios.interceptors.request.use(
  (config) => {
    const token = secureLocalStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Component mapping for dynamic routing
const componentMap = {
  Home,
  Gallery,
  Contact,
  About,
  RegisterPage,
  OtpVerification,
  ResetPassword,
  ForgotPassword,
  LoginPage,
  Blog,
  BlogPreviewHome,
  CategoryBlogPage,
  CategoryBlogPreviewPage,
  CategoryBlogCreatePage,
  CategoryBlogUpdatePage,
  BlogPage,
  BlogPreviewPage,
  BlogCreatePage,
  BlogUpdatePage,
  ContactPage,
  BodyPage,
  OperationalPage,
  BannerPage,
  Dashboard,
  UserPage,
  AccountPage,
  UserCreatePage,
  UserUpdatePage,
  NotificationPage,
  NotificationPreviewPage,
  NotificationCreatePage,
  NotificationUpdatePage,
  RolePage,
  RoleCreatePage,
  RoleUpdatePage,
  LandingManagementPage,
  Disnaker,
  ServiceManagementPage,
};

// Routes JSON
const routesData = [
  {
    path: "/",
    layout: "SidebarGeneralLayout",
    component: "Home",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/blogs",
    layout: "SidebarGeneralLayout",
    component: "Blog",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/gallery",
    layout: "SidebarGeneralLayout",
    component: "Gallery",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/contact-us",
    layout: "SidebarGeneralLayout",
    component: "Contact",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/about",
    layout: "SidebarGeneralLayout",
    component: "About",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/blog/:key",
    layout: "SidebarGeneralLayout",
    component: "BlogPreviewHome",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/register",
    layout: "SidebarGeneralLayout",
    component: "RegisterPage",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/verify-otp",
    layout: "SidebarGeneralLayout",
    component: "OtpVerification",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/forgot-password",
    layout: "SidebarGeneralLayout",
    component: "ForgotPassword",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/reset-password",
    layout: "SidebarGeneralLayout",
    component: "ResetPassword",
    isAuthRequired: false,
    children: [],
  },
  {
    path: "/login",
    layout: "SidebarGeneralLayout",
    component: "LoginPage",
    isAuthRequired: false,
    children: [],
  },

  {
    path: "/service-management",
    layout: "ConditionalAuthGeneral",
    isAuthRequired: true,
    children: [
      { path: "", component: "ServiceManagementPage", isAuthRequired: true },
    ],
  },
  {
    path: "/category/blog",
    layout: "ConditionalAuthGeneral",
    isAuthRequired: true,
    children: [
      { path: "", component: "CategoryBlogPage", isAuthRequired: true },
      {
        path: "preview/:key",
        component: "CategoryBlogPreviewPage",
        isAuthRequired: true,
      },
      {
        path: "create",
        component: "CategoryBlogCreatePage",
        isAuthRequired: true,
      },
      {
        path: "update/:key",
        component: "CategoryBlogUpdatePage",
        isAuthRequired: true,
      },
    ],
  },
  {
    path: "/blog",
    layout: "ConditionalAuthGeneral",
    isAuthRequired: true,
    children: [
      { path: "", component: "BlogPage", isAuthRequired: true },
      {
        path: "preview/:key",
        component: "BlogPreviewPage",
        isAuthRequired: true,
      },
      { path: "create", component: "BlogCreatePage", isAuthRequired: true },
      {
        path: "update/:key",
        component: "BlogUpdatePage",
        isAuthRequired: true,
      },
    ],
  },
  {
    path: "/contact",
    layout: "SidebarAuthLayout",
    component: "ContactPage",
    isAuthRequired: true,
    children: [],
  },
  {
    path: "/body",
    layout: "SidebarAuthLayout",
    component: "BodyPage",
    isAuthRequired: true,
    children: [],
  },
  {
    path: "/operational",
    layout: "SidebarAuthLayout",
    component: "OperationalPage",
    isAuthRequired: true,
    children: [],
  },
  {
    path: "/banners",
    layout: "SidebarAuthLayout",
    component: "BannerPage",
    isAuthRequired: true,
    children: [],
  },
  {
    path: "/dashboard",
    layout: "ConditionalUserRole",
    component: "Dashboard",
    isAuthRequired: true,
    children: [],
  },
  {
    path: "/users",
    layout: "SidebarAuthLayout",
    isAuthRequired: true,
    children: [
      { path: "", component: "UserPage", isAuthRequired: true },
      // {
      //   path: "preview/:id",
      //   component: "UserPreviewPage",
      //   isAuthRequired: true,
      // },
      { path: "account", component: "AccountPage", isAuthRequired: true },
      { path: "create", component: "UserCreatePage", isAuthRequired: true },
      { path: "update/:id", component: "UserUpdatePage", isAuthRequired: true },
    ],
  },
  {
    path: "/notifications",
    layout: "SidebarAuthLayout",
    isAuthRequired: true,
    children: [
      { path: "", component: "NotificationPage", isAuthRequired: true },
      {
        path: "preview/:id",
        component: "NotificationPreviewPage",
        isAuthRequired: true,
      },
      {
        path: "create",
        component: "NotificationCreatePage",
        isAuthRequired: true,
      },
      {
        path: "update/:id",
        component: "NotificationUpdatePage",
        isAuthRequired: true,
      },
    ],
  },
  {
    path: "/roles",
    layout: "SidebarAuthLayout",
    isAuthRequired: true,
    children: [
      { path: "", component: "RolePage", isAuthRequired: true },
      {
        path: "preview/:key",
        component: "PaymentPreviewPage",
        isAuthRequired: true,
      },
      { path: "create", component: "RoleCreatePage", isAuthRequired: true },
      {
        path: "update/:params",
        component: "RoleUpdatePage",
        isAuthRequired: true,
      },
    ],
  },

  {
    path: "/landing-management",
    layout: "SidebarAuthLayout",
    isAuthRequired: true,
    children: [
      { path: "", component: "LandingManagementPage", isAuthRequired: true },
    ],
  },
  {
    path: "/organization-management",
    layout: "SidebarAuthLayout",
    isAuthRequired: true,
    children: [
      {
        path: "",
        component: "OrganizationManagementPage",
        isAuthRequired: true,
      },
    ],
  },
];

function App() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuth = useSelector(selectIsAuthenticated);
  const token = useSelector(selectToken);
  const { logos } = useSelector((state) => state.logos);
  const theme = useSelector(selectLocalTheme);

  const navigate = useNavigate();
  const location = useLocation(); // ✅ Tambahkan ini!

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Refs untuk prevent duplicate validation
  const isValidatingRef = useRef(false);
  const hasValidatedRef = useRef(false);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    setIsOnline(true);
  }, []);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const localTheme = localStorage.getItem("theme");
    const activeTheme = localTheme || "black";

    localStorage.setItem("theme", activeTheme);

    html.removeAttribute("data-theme");
    html.classList.remove("black", "wireframe", "dark");
    body.classList.remove("black", "wireframe", "dark");

    if (activeTheme === "black") {
      html.setAttribute("data-theme", "black");
      html.classList.add("black", "dark");
      document.body.style.backgroundColor = "";
    } else {
      html.setAttribute("data-theme", "wireframe");
      html.classList.add("wireframe");
      document.body.style.backgroundColor = "";
    }
  }, [theme]);

  useEffect(() => {
    const validThemes = ["black", "wireframe"];
    const current = localStorage.getItem("theme");
    if (!validThemes.includes(current)) {
      localStorage.setItem("theme", "black");
    }
  }, []);

  // ✅ AUTH VALIDATION EFFECT
  useEffect(() => {
    if (!token) {
      console.log("No token found, skipping validation");
      return;
    }

    if (isValidatingRef.current) {
      console.log("Validation already in progress");
      return;
    }

    if (hasValidatedRef.current) {
      console.log("Token already validated in this session");
      return;
    }

    let cancelled = false;
    isValidatingRef.current = true;

    const handleLogout = async (reason = "") => {
      if (cancelled) return;

      console.warn("🔴 Logging out...", reason);

      try {
        await dispatch(logout()).unwrap();
      } catch (e) {
        console.warn("Logout dispatch failed:", e);
      }

      secureLocalStorage.clear();
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith("scrollPosition-")) {
          sessionStorage.removeItem(key);
        }
      });

      delete axios.defaults.headers.common["Authorization"];

      hasValidatedRef.current = false;
      isValidatingRef.current = false;

      const currentPath = location.pathname + location.search;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, {
        replace: true,
      });
    };

    const validateToken = async () => {
      if (cancelled) return;

      try {
        console.log("🔍 Starting token validation...");

        await new Promise((resolve) => setTimeout(resolve, 100));
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        const result = await dispatch(checkAuth()).unwrap();
        console.log("✅ Token validation successful:", result);

        if (cancelled) return;

        if (result?.user) {
          dispatch(updateSingleUser(result.user));
        }

        hasValidatedRef.current = true;

        try {
          await dispatch(fetchInitialData()).unwrap();
        } catch (e) {
          console.warn("⚠️ Failed to fetch initial data (not critical):", e);
        }
      } catch (error) {
        if (cancelled) return;

        const status = error?.status || error?.response?.status || 0;
        const timeSinceMount = Date.now() - mountTimeRef.current;

        console.error("❌ Token validation failed:", {
          status,
          message: error?.message,
          timeSinceMount: `${timeSinceMount}ms`,
        });

        if (timeSinceMount < 3000) {
          console.warn("⏳ Too early to validate, skipping logout");
          hasValidatedRef.current = true;
          isValidatingRef.current = false;
          return;
        }

        if (status === 401) {
          console.warn("🔴 401 Unauthorized - Token invalid or expired");
          await handleLogout("Token expired or invalid (401)");
        } else {
          console.warn(
            `⚠️ Validation error (${status || "unknown"}), but keeping session`
          );
          hasValidatedRef.current = true;
          isValidatingRef.current = false;
        }
      } finally {
        if (!cancelled) {
          isValidatingRef.current = false;
        }
      }
    };

    const timeoutId = setTimeout(validateToken, 500);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      isValidatingRef.current = false;
    };
  }, [token, dispatch, navigate, location.pathname, location.search]);

  useEffect(() => {
    const getTheme = async () => {
      try {
        await dispatch(fetchTheme()).unwrap();
      } catch (error) {
        console.error("Failed to fetch theme data:", error);
      }
    };
    getTheme();
  }, [dispatch]);

  useEffect(() => {
    const favicon = document.getElementById("favicon");
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');

    if (logos?.image) {
      const imageUrl = `${process.env.REACT_APP_API}logo/images/${
        logos.image
      }?t=${Date.now()}`;
      if (favicon) favicon.href = imageUrl;
      if (ogImage) ogImage.setAttribute("content", imageUrl);
      if (twitterImage) twitterImage.setAttribute("content", imageUrl);
    }
  }, [logos]);

  if (!isOnline) {
    return <OfflinePage />;
  }

  // Map layouts to components

  const renderComponent = (route, user) => {
    const Component = componentMap[route.component];
    if (!Component) return null;

    if (route.isAuthRequired && !user) {
      return <Navigate to="/login" />;
    }

    if (route.wrapper === "CenteredContainer") {
      return (
        <div className="max-w-screen-lg md:mx-auto px-2 p-2">
          <Component />
        </div>
      );
    }

    return <Component />;
  };

  const getLayout = (layout, isAuth, user) => {
    switch (layout) {
      case "SidebarGeneralLayout":
        return <SidebarGeneralLayout />;
      case "SidebarAuthLayout":
        return <SidebarAuthLayout />;
      case "SidebarUserLayout":
        return <SidebarUserLayout />;
      case "ConditionalAuthGeneral":
        return isAuth ? <SidebarAuthLayout /> : <SidebarGeneralLayout />;
      case "ConditionalUserRole":
        return user?.role === "user" ? (
          <SidebarAuthLayout />
        ) : (
          <SidebarAuthLayout />
        );
      default:
        return null;
    }
  };

  // Recursive function to render routes from JSON
  const renderRoutes = (routes) =>
    routes.map((route, index) => {
      const Component = route.component ? componentMap[route.component] : null;
      const layoutElement = getLayout(route.layout, isAuth, user);

      // Routes with children
      if (route.children && route.children.length > 0) {
        return (
          <Route key={index} path={route.path} element={layoutElement}>
            {route.children.map((child, childIndex) => (
              <Route
                key={childIndex}
                path={child.path}
                index={child.path === ""}
                element={
                  child.isAuthRequired ? (
                    <ProtectedRoute isAuth={isAuth}>
                      {renderComponent(child, user)}
                    </ProtectedRoute>
                  ) : (
                    renderComponent(child, user)
                  )
                }
              />
            ))}
          </Route>
        );
      }

      // Routes without children
      return (
        <Route key={index} path={route.path} element={layoutElement}>
          <Route
            index
            element={
              route.isAuthRequired ? (
                <ProtectedRoute isAuth={isAuth}>
                  {route.component === "Dashboard"
                    ? renderComponent(route, user)
                    : Component && <Component />}
                </ProtectedRoute>
              ) : route.layout === "SidebarPromotion" ? null : (
                Component && <Component />
              )
            }
          />
        </Route>
      );
    });

  return (
    <>
      <TopBarProvider>
        <CustomSwitch>{renderRoutes(routesData)}</CustomSwitch>
      </TopBarProvider>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" 
      />
    </>
  );
}

const SidebarGeneralLayout = () => {
  const location = useLocation();
  const isPublicPage = location.pathname === "/"; // Sesuaikan dengan path Home
  return (
    <SidebarGeneral isPublicPage={isPublicPage}>
      <Outlet />
    </SidebarGeneral>
  );
};

const SidebarUserLayout = () => (
  <SidebarGeneralAuth>
    <Outlet />
  </SidebarGeneralAuth>
);

const SidebarAuthLayout = () => (
  <SidebarGeneralAuth>
    <Outlet />
  </SidebarGeneralAuth>
);

export default App;

export const CustomSwitch = ({ children }) => {
  const location = useLocation();
  const topBar = useTopBar();

  React.useEffect(() => {
    topBar?.start();
    const timer = setTimeout(() => topBar?.finish(), 500);

    return () => {
      clearTimeout(timer);
      topBar?.finish();
    };
  }, [location]); 

  return (
    <Routes location={location} key={location.pathname}>
      {children}
    </Routes>
  );
};