import React, { useRef, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import * as LucideIcons from "lucide-react";
import {
  logout,
  resetState,
  selectUser,
} from "../features/authentication/AuthSlice";
import { fetchContacts } from "../features/LandingPages/contactSlice";
import { formatPhoneNumber } from "../Pages/Secret/Components/phoneNumberInput";
import { fetchLogos } from "../features/LandingPages/logoSlice";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [programDesktopDropdown, setProgramDesktopDropdown] = useState(false);
  const [programMobileDropdown, setProgramMobileDropdown] = useState(false);
  const [aboutDesktopDropdown, setAboutDesktopDropdown] = useState(false);
  const [aboutMobileDropdown, setAboutMobileDropdown] = useState(false);
  const [loadSubmit, setLoadSubmit] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const currentUser = useSelector(selectUser);
  const logo = useSelector((s) => s.logos.logos);
  const logoStatus = useSelector((s) => s.logos.status);
  const { contacts, status: contactStatus } = useSelector(
    (state) => state.contacts
  );

  const dropdownRef = useRef(null);
  const programDesktopDropdownRef = useRef(null);
  const programMobileDropdownRef = useRef(null);
  const aboutDesktopDropdownRef = useRef(null);
  const aboutMobileDropdownRef = useRef(null);
  const menuRef = useRef(null);

  /* Fetch contacts and body data */
  useEffect(() => {
    const getLogo = async () => {
      try {
        await dispatch(fetchLogos()).unwrap();
      } catch (error) {
        console.error("Failed to fetch logos:", error);
      }
    };
    if (logoStatus === "idle") {
      getLogo();
    }
  }, [dispatch]);
  useEffect(() => {
    if (contactStatus === "idle") {
      dispatch(fetchContacts());
    }
  }, [dispatch, contactStatus]);

  /* Scroll effect */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Click outside handler */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdown(false);
      if (
        programDesktopDropdownRef.current &&
        !programDesktopDropdownRef.current.contains(e.target)
      )
        setProgramDesktopDropdown(false);
      if (
        programMobileDropdownRef.current &&
        !programMobileDropdownRef.current.contains(e.target)
      )
        setProgramMobileDropdown(false);
      if (
        aboutDesktopDropdownRef.current &&
        !aboutDesktopDropdownRef.current.contains(e.target)
      )
        setAboutDesktopDropdown(false);
      if (
        aboutMobileDropdownRef.current &&
        !aboutMobileDropdownRef.current.contains(e.target)
      )
        setAboutMobileDropdown(false);
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !e.target.closest(".hamburger-btn")
      )
        setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setIsMenuOpen(false);
    setProgramDesktopDropdown(false);
    setProgramMobileDropdown(false);
    setAboutDesktopDropdown(false);
    setAboutMobileDropdown(false);
    setDropdown(false);
  }, [location.pathname]);

  /* Logout */
  const handleLogout = async () => {
    try {
      setLoadSubmit(true);
      dispatch(logout());
      dispatch(resetState());
      toast.info("Anda berhasil logout!");
      navigate("/");
    } catch (err) {
      toast.error("Logout gagal!");
      console.error(err);
    } finally {
      setLoadSubmit(false);
    }
  };

  const handleNavigate = (key) => {
    navigate(key);
    setIsMenuOpen(false);
    setProgramDesktopDropdown(false);
    setProgramMobileDropdown(false);
    setAboutDesktopDropdown(false);
    setAboutMobileDropdown(false);
    setDropdown(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* MENU DATA */
  const menu = useMemo(() => {
    return [
      { name: "Home", icon: "Home", key: "/" },
      { name: "Article", icon: "Newspaper", key: "/blogs" },
      { name: "Gallery", icon: "Images", key: "/gallery" },
      { name: "About", icon: "Info", key: "/about" },
      { name: "Contact", icon: "Phone", key: "/contact-us" },
    ];
  }, []);

  /* Helper: render dropdown items */
  const renderDropdownMenu = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return (
        <div className="py-4 px-4 text-center text-gray-500">
          <span className="text-sm">Tidak ada program tersedia</span>
        </div>
      );
    }

    return (
      <div className="py-2 space-y-1">
        {items.map((child, idx) => {
          const ChildIcon = LucideIcons[child.icon] || LucideIcons.Calendar;
          return (
            <button
              key={`${child.key}-${idx}`}
              onClick={() => handleNavigate(child.key)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-left">
              <ChildIcon size={16} className="text-blue-600" />
              <span className="font-medium text-sm">{child.name}</span>
            </button>
          );
        })}
      </div>
    );
  };

  /* MAIN RETURN */
  return (
    <>
      {/* TOP INFO BAR */}
      <div className="bg-[#2F2F2F] text-white py-2 sm:py-4 md:py-6 px-3 sm:px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Layout (< 768px) */}
          <div className="md:hidden flex items-start gap-2">
            {logo?.image ? (
              <img
                src={logo.image}
                alt="Logo"
                className="w-12 h-12 object-contain rounded p-0.5 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 bg-white rounded p-0.5 flex items-center justify-center flex-shrink-0">
                <LucideIcons.Briefcase size={20} className="text-blue-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-sm leading-tight line-clamp-2 mb-1">
                {logo?.app_title || "Dinas Ketenagakerjaan"}
              </h1>
              {logo?.app_body && (
                <div
                  className="text-xs text-gray-300 leading-snug line-clamp-2 mb-1.5"
                  dangerouslySetInnerHTML={{ __html: logo?.app_body }}
                />
              )}
              <div className="space-y-0.5 flex flex-wrap gap-3 items-center">
                {contacts?.email && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <LucideIcons.Mail size={12} className="flex-shrink-0" />
                    <span className="truncate">{contacts.email}</span>
                  </div>
                )}
                {contacts?.whatsapp && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <LucideIcons.Phone size={12} className="flex-shrink-0" />
                    <span className="truncate">
                      {formatPhoneNumber(contacts?.whatsapp)}
                    </span>
                  </div>
                )}
                {contacts?.instagram && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <LucideIcons.InstagramIcon
                      size={12}
                      className="flex-shrink-0"
                    />
                    <span className="truncate">{contacts?.instagram}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tablet & Desktop Layout (≥ 768px) */}
          <div className="hidden md:flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 lg:gap-4">
            <div className="flex items-start gap-3">
              {logo?.image ? (
                <img
                  src={logo.image}
                  alt="Logo"
                  className="w-16 h-16 lg:w-20 lg:h-20 object-contain rounded p-1 flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white rounded p-1 flex items-center justify-center flex-shrink-0">
                  <LucideIcons.Briefcase size={24} className="text-blue-600" />
                </div>
              )}
              <div>
                <h1 className="font-bold text-base lg:text-xl line-clamp-2 mb-1">
                  {logo?.app_title || "Dinas Ketenagakerjaan"}
                </h1>
                {logo?.app_body && (
                  <div
                    className="text-xs lg:text-sm text-gray-300 leading-relaxed line-clamp-2"
                    dangerouslySetInnerHTML={{ __html: logo?.app_body }}
                  />
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs lg:text-sm">
              {contacts?.email && (
                <div className="flex items-center gap-2">
                  <LucideIcons.Mail size={14} className="flex-shrink-0" />
                  <span className="truncate max-w-xs">{contacts.email}</span>
                </div>
              )}
              {contacts?.whatsapp && (
                <div className="flex items-center gap-2">
                  <LucideIcons.Phone size={14} className="flex-shrink-0" />
                  <span>{formatPhoneNumber(contacts?.whatsapp)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STICKY NAVIGATION */}
      <header
        className={`sticky top-0 z-50 border-b border-[#2F2F2F] transition-all duration-300 ${
          scrolled ? "shadow-lg" : ""
        } bg-[#1F1F1F]`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex justify-between items-center">
            {/* DESKTOP NAV */}
            <nav className="hidden lg:flex items-center">
              {menu?.map((item, idx) => {
                const hasChildren = item.children && item.children.length > 0;
                let dropdownState = false;
                let setDropdownState = () => {};
                let dropdownRefLocal = null;

                if (hasChildren) {
                  if (item.name === "PROGRAM KERJA") {
                    dropdownState = programDesktopDropdown;
                    setDropdownState = setProgramDesktopDropdown;
                    dropdownRefLocal = programDesktopDropdownRef;
                  } else if (item.name === "TENTANG KAMI") {
                    dropdownState = aboutDesktopDropdown;
                    setDropdownState = setAboutDesktopDropdown;
                    dropdownRefLocal = aboutDesktopDropdownRef;
                  }
                }

                return (
                  <div
                    key={`${item.name}-${idx}`}
                    ref={hasChildren ? dropdownRefLocal : null}
                    className="relative">
                    {!hasChildren ? (
                      <button
                        onClick={() => handleNavigate(item.key)}
                        className={`px-4 xl:px-5 py-3 xl:py-3.5 text-white hover:bg-[#5a5a5a] transition-all duration-200 text-xs font-semibold uppercase tracking-wide border-r border-[#5a5a5a] last:border-r-0 ${
                          location.pathname === item.key ? "bg-[#5a5a5a]" : ""
                        }`}>
                        {item.name}
                      </button>
                    ) : (
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownState(!dropdownState);
                          }}
                          className="flex items-center gap-1.5 px-4 xl:px-5 py-3 xl:py-3.5 text-white hover:bg-[#5a5a5a] transition-all duration-200 text-xs font-semibold uppercase tracking-wide border-r border-[#5a5a5a]">
                          <span>{item.name}</span>
                          <LucideIcons.ChevronDown
                            size={14}
                            className={`transition-transform duration-200 ${
                              dropdownState ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {dropdownState && (
                          <div className="absolute top-full left-0 mt-0 w-64 bg-white rounded-b-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                            {renderDropdownMenu(item.children)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* USER MENU DESKTOP */}
            {currentUser ? (
              <div ref={dropdownRef} className="relative hidden lg:block">
                <button
                  onClick={() => setDropdown(!dropdown)}
                  className="flex items-center space-x-2 px-3 xl:px-4 py-3 text-white hover:bg-[#5a5a5a] transition-all duration-200">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                    <LucideIcons.User size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-medium max-w-24 truncate">
                    {currentUser?.name?.split(" ")[0] || "User"}
                  </span>
                  <LucideIcons.ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${
                      dropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {dropdown && (
                  <div className="absolute top-full right-0 mt-0 w-56 bg-white rounded-b-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                    <div className="p-3 bg-blue-50 border-b border-gray-200 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <LucideIcons.User size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {currentUser?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {currentUser?.email || ""}
                        </p>
                      </div>
                    </div>
                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => handleNavigate("/dashboard")}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-left">
                        <LucideIcons.LayoutDashboard size={16} />
                        <span className="font-medium text-sm">Dashboard</span>
                      </button>
                      <button
                        onClick={() =>
                          handleNavigate(
                            `/users/account?email=${currentUser.email}`
                          )
                        }
                        className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 text-left">
                        <LucideIcons.User size={16} />
                        <span className="font-medium text-sm">Profil Saya</span>
                      </button>
                      <div className="border-t border-gray-200 pt-1 mt-1">
                        <button
                          onClick={handleLogout}
                          disabled={loadSubmit}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 text-left">
                          <LucideIcons.LogOut size={16} />
                          <span className="font-medium text-sm">
                            {loadSubmit ? "Keluar..." : "Keluar"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                <button
                  onClick={() => handleNavigate("/login")}
                  className="px-4 xl:px-5 py-3 text-white hover:bg-[#5a5a5a] transition-all duration-200 text-xs font-semibold uppercase tracking-wide">
                  Masuk
                </button>
              </div>
            )}

            {/* MOBILE BURGER BUTTON */}
            <button
              className="lg:hidden p-2.5 sm:p-3 text-white hover:bg-[#5a5a5a] rounded hamburger-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle mobile menu">
              {isMenuOpen ? (
                <LucideIcons.X size={22} />
              ) : (
                <LucideIcons.Menu size={22} />
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        <div
          className={`lg:hidden transition-all duration-300 overflow-hidden ${
            isMenuOpen ? "max-h-screen" : "max-h-0"
          }`}>
          <div ref={menuRef} className="bg-[#5a5a5a] border-t border-[#6a6a6a]">
            <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1 max-h-[70vh] overflow-y-auto">
              {menu?.map((item, idx) => {
                const IconComp = LucideIcons[item.icon] || LucideIcons.Circle;
                const hasChildren = item.children && item.children.length > 0;
                let dropdownState = false;
                let setDropdownState = () => {};
                let dropdownRefLocal = null;

                if (hasChildren) {
                  if (item.name === "PROGRAM KERJA") {
                    dropdownState = programMobileDropdown;
                    setDropdownState = setProgramMobileDropdown;
                    dropdownRefLocal = programMobileDropdownRef;
                  } else if (item.name === "TENTANG KAMI") {
                    dropdownState = aboutMobileDropdown;
                    setDropdownState = setAboutMobileDropdown;
                    dropdownRefLocal = aboutMobileDropdownRef;
                  }
                }

                return (
                  <div
                    key={`mobile-${item.name}-${idx}`}
                    className="w-full"
                    ref={hasChildren ? dropdownRefLocal : null}>
                    {!hasChildren ? (
                      <button
                        onClick={() => handleNavigate(item.key)}
                        className={`w-full flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 text-white hover:bg-[#6a6a6a] rounded-lg transition-all duration-200 text-left ${
                          location.pathname === item.key ? "bg-[#6a6a6a]" : ""
                        }`}>
                        <IconComp size={18} className="flex-shrink-0" />
                        <span className="font-semibold text-sm uppercase tracking-wide">
                          {item.name}
                        </span>
                      </button>
                    ) : (
                      <div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDropdownState(!dropdownState);
                          }}
                          className="w-full flex items-center justify-between p-2.5 sm:p-3 text-white hover:bg-[#6a6a6a] rounded-lg transition-all duration-200">
                          <div className="flex items-center space-x-2.5 sm:space-x-3">
                            <IconComp size={18} className="flex-shrink-0" />
                            <span className="font-semibold text-sm uppercase tracking-wide">
                              {item.name}
                            </span>
                          </div>
                          <LucideIcons.ChevronDown
                            size={16}
                            className={`transition-transform duration-200 flex-shrink-0 ${
                              dropdownState ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        {dropdownState && (
                          <div className="mt-1 ml-4 sm:ml-6 space-y-1">
                            {renderDropdownMenu(item.children)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* MOBILE USER SECTION */}
              {currentUser ? (
                <div className="pt-2 sm:pt-3 border-t border-[#6a6a6a] space-y-1">
                  <div className="flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 bg-[#6a6a6a] rounded-lg">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <LucideIcons.User size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate text-sm">
                        {currentUser?.name || "User"}
                      </p>
                      <p className="text-xs text-gray-300 truncate">
                        {currentUser?.email || ""}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNavigate("/dashboard")}
                    className="w-full flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 text-white hover:bg-[#6a6a6a] rounded-lg transition-all duration-200 text-left">
                    <LucideIcons.LayoutDashboard
                      size={18}
                      className="flex-shrink-0"
                    />
                    <span className="font-medium text-sm">Dashboard</span>
                  </button>

                  <button
                    onClick={() =>
                      handleNavigate(
                        `/users/account?email=${currentUser.email}`
                      )
                    }
                    className="w-full flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 text-white hover:bg-[#6a6a6a] rounded-lg transition-all duration-200 text-left">
                    <LucideIcons.User size={18} className="flex-shrink-0" />
                    <span className="font-medium text-sm">Profil Saya</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={loadSubmit}
                    className="w-full flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 text-red-400 hover:bg-[#6a6a6a] rounded-lg transition-all duration-200 disabled:opacity-50 text-left">
                    <LucideIcons.LogOut size={18} className="flex-shrink-0" />
                    <span className="font-medium text-sm">
                      {loadSubmit ? "Keluar..." : "Keluar"}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="pt-2 sm:pt-3 border-t border-[#6a6a6a] space-y-2">
                  <button
                    onClick={() => handleNavigate("/login")}
                    className="w-full p-2.5 sm:p-3 text-white hover:bg-[#6a6a6a] rounded-lg transition-all duration-200 font-semibold text-left uppercase tracking-wide text-sm">
                    Masuk
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
