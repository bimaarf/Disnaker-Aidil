import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Copy,
  ExternalLink,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
} from "lucide-react";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import "../App.css";
import { fetchBody } from "../features/LandingPages/bodySlice";
import { fetchContacts } from "../features/LandingPages/contactSlice";
import { fetchOperational } from "../features/LandingPages/operationalSlice";
import { HeroSection } from "./Components/HeroSection";

export const Contact = () => {
  const dispatch = useDispatch();

  const { contacts, status: contactStatus } = useSelector(
    (state) => state.contacts
  );
  const {
    hours = [],
    note: operationalNote,
    status: operationalStatus,
  } = useSelector((state) => state.operational);
  const { body, status: bodyStatus } = useSelector((state) => state.body);

  const [isContactMethodsVisible, setIsContactMethodsVisible] = useState(false);
  const [isOfficeHoursVisible, setIsOfficeHoursVisible] = useState(false);
  const [isAddressVisible, setIsAddressVisible] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const contactMethodsRef = useRef(null);
  const officeHoursRef = useRef(null);
  const addressRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (contactStatus === "idle") {
      dispatch(fetchContacts());
    }
  }, [dispatch, contactStatus]);

  useEffect(() => {
    if (operationalStatus === "idle") {
      dispatch(fetchOperational());
    }
  }, [dispatch, operationalStatus]);

  useEffect(() => {
    if (bodyStatus === "idle") {
      dispatch(fetchBody());
    }
  }, [dispatch, bodyStatus]);

  useLayoutEffect(() => {
    const savedScrollPosition = sessionStorage.getItem("contactScrollPosition");
    if (savedScrollPosition) {
      const position = parseInt(savedScrollPosition, 10);
      if (!isNaN(position)) {
        window.scrollTo({
          top: position,
          behavior: "instant",
        });
      }
    }
  }, []);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          sessionStorage.setItem("contactScrollPosition", window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const createObserver = (callback, element) => {
      const options = {
        threshold: 0.1,
        rootMargin: "0px",
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          callback(entry.isIntersecting);
        });
      }, options);

      if (element) {
        observer.observe(element);
      }

      return observer;
    };

    const contactMethodsObserver = createObserver(
      setIsContactMethodsVisible,
      contactMethodsRef.current
    );
    const officeHoursObserver = createObserver(
      setIsOfficeHoursVisible,
      officeHoursRef.current
    );
    const addressObserver = createObserver(
      setIsAddressVisible,
      addressRef.current
    );

    return () => {
      window.removeEventListener("scroll", handleScroll);
      contactMethodsObserver.disconnect();
      officeHoursObserver.disconnect();
      addressObserver.disconnect();
    };
  }, []);

  const formatWhatsappNumber = (phoneNumber) => {
    if (!phoneNumber) return null;

    let phoneStr = String(phoneNumber).trim();

    if (!phoneStr.startsWith("628")) {
      phoneStr = phoneStr.replace(/\D/g, "");
      if (phoneStr.startsWith("0")) {
        phoneStr = "62" + phoneStr.slice(1);
      }
    }

    return phoneStr;
  };

  const handleCopy = async (text, index) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleCopyAddress = async () => {
    try {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = body?.address || "";
      const plainText = tempDiv.textContent || tempDiv.innerText || "";
      await navigator.clipboard.writeText(plainText);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  const getEmbedUrl = (link) => {
    if (!link) return "";

    if (link.includes("google.com/maps/embed")) return link;

    const match = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      const [, lat, lng] = match;
      return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }

    if (link.includes("/maps/place/")) {
      const place = link
        .split("/maps/place/")[1]
        ?.split("/")[0]
        ?.replace(/\+/g, " ");
      return `https://maps.google.com/maps?q=${encodeURIComponent(
        place
      )}&z=15&output=embed`;
    }

    return "";
  };

  const contactMethods = [
    ...(contacts?.email
      ? [
          {
            icon: Mail,
            title: "Email",
            description: "Hubungi kami untuk informasi program",
            value: contacts.email,
            action: `mailto:${contacts.email}`,
            color: "#1e40af",
            category: "digital",
          },
        ]
      : []),
    ...(contacts?.whatsapp
      ? [
          {
            icon: MessageCircle,
            title: "WhatsApp",
            description: "Chat dengan tim kami",
            value: formatWhatsappNumber(contacts.whatsapp),
            action: `https://wa.me/${formatWhatsappNumber(contacts.whatsapp)}`,
            color: "#059669",
            category: "messaging",
          },
        ]
      : []),
    ...(contacts?.telegram
      ? [
          {
            icon: MessageCircle,
            title: "Telegram",
            description: "Gabung channel update kami",
            value: contacts.telegram,
            action: `https://t.me/${contacts.telegram.replace("@", "")}`,
            color: "#0369a1",
            category: "messaging",
          },
        ]
      : []),
    ...(contacts?.instagram
      ? [
          {
            icon: Instagram,
            title: "Instagram",
            description: "Ikuti kegiatan kami",
            value: contacts.instagram,
            action: `https://instagram.com/${contacts.instagram.replace(
              "@",
              ""
            )}`,
            color: "#be185d",
            category: "social",
          },
        ]
      : []),
  ];

  const filteredContactMethods = useMemo(() => {
    return contactMethods.filter((method) => {
      const matchesFilter =
        activeFilter === "all" || method.category === activeFilter;
      const matchesSearch =
        method.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        method.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        method.value.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [contactMethods, activeFilter, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection landingProps="contact-page" />

      {/* Contact Methods Section */}
      <section ref={contactMethodsRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-12 transition-all duration-1000 ${
              isContactMethodsVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-16 opacity-0"
            }`}>
            <div className="inline-block px-4 py-2 bg-red-50 border border-red-100 rounded-md mb-4">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                Hubungi Kami
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Metode Kontak
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Pilih cara terbaik untuk menghubungi kami
            </p>
          </div>

          {filteredContactMethods.length > 0 ? (
            <div
              className={`flex flex-col sm:flex-row justify-center gap-6 justify-items-center transition-all duration-1000 ${
                isContactMethodsVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "200ms" }}>
              {filteredContactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div
                    key={index}
                    className={`bg-white border border-gray-200 rounded-lg p-6 mx-auto w-full max-w-xs transition-all duration-300 hover:border-gray-300 hover:shadow-md ${
                      isContactMethodsVisible
                        ? "translate-y-0 opacity-100"
                        : "translate-y-16 opacity-0"
                    }`}
                    style={{ transitionDelay: `${(index % 4) * 100 + 400}ms` }}>
                    <div
                      className="w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center"
                      style={{ backgroundColor: `${method.color}15` }}>
                      <Icon
                        className="w-6 h-6"
                        style={{ color: method.color }}
                      />
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">
                      {method.title}
                    </h4>

                    <p className="text-sm text-gray-600 mb-4 text-center leading-relaxed min-h-[40px]">
                      {method.description}
                    </p>

                    <div
                      className="font-medium mb-4 text-sm break-words text-center"
                      style={{ color: method.color }}>
                      {method.value}
                    </div>

                    <div className="flex flex-col gap-2">
                      <a
                        href={method.action}
                        target={
                          method.action.startsWith("http") ? "_blank" : "_self"
                        }
                        rel={
                          method.action.startsWith("http")
                            ? "noopener noreferrer"
                            : ""
                        }
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-white text-sm font-medium transition-colors"
                        style={{ backgroundColor: method.color }}>
                        <ExternalLink className="w-4 h-4" />
                        Hubungi
                      </a>

                      <button
                        onClick={() => handleCopy(method.value, index)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors">
                        {copiedIndex === index ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tidak ada kontak ditemukan
              </h3>
              <p className="text-gray-600 text-sm mb-6">
                Coba ubah kata kunci pencarian atau filter kategori
              </p>
              {(searchTerm || activeFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setActiveFilter("all");
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-md font-medium transition-colors">
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Office Hours Section */}
      <section ref={officeHoursRef} className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-1000 ${
              isOfficeHoursVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-16 opacity-0"
            }`}>
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
              <div className="flex items-center gap-3">
                <Clock className="w-7 h-7 text-white" />
                <h3 className="text-xl font-bold text-white">
                  Jam Operasional
                </h3>
              </div>
            </div>

            <div className="p-8">
              {operationalStatus === "loading" && (
                <div className="flex flex-col justify-center items-center py-16">
                  <div className="relative w-16 h-16 mb-4">
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                    <div className="absolute inset-0 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-gray-600 font-medium">Memuat jadwal...</p>
                </div>
              )}

              {operationalStatus === "failed" && (
                <div className="text-center py-16">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                    <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                    <div className="text-red-700 text-lg font-semibold mb-2">
                      Gagal memuat jadwal
                    </div>
                    <p className="text-red-600 text-sm">
                      Terjadi kesalahan saat memuat data.
                    </p>
                  </div>
                </div>
              )}

              {operationalStatus === "succeeded" && (
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                      Jadwal Operasional
                    </h4>
                    <div className="space-y-2">
                      {hours.map((schedule, index) => (
                        <div
                          key={index}
                          className={`flex justify-between items-center py-3 px-4 border-b border-gray-100 last:border-0 transition-all duration-300 ${
                            isOfficeHoursVisible
                              ? "translate-x-0 opacity-100"
                              : "translate-x-8 opacity-0"
                          }`}
                          style={{ transitionDelay: `${200 + index * 50}ms` }}>
                          <span className="text-gray-700 font-medium capitalize">
                            {schedule.day}
                          </span>
                          <span
                            className={`font-semibold ${
                              schedule.is_closed ||
                              !schedule.open_time ||
                              !schedule.close_time
                                ? "text-red-600"
                                : "text-green-600"
                            }`}>
                            {schedule.is_closed ||
                            !schedule.open_time ||
                            !schedule.close_time
                              ? "Tutup"
                              : `${schedule.open_time.slice(
                                  0,
                                  5
                                )} - ${schedule.close_time.slice(0, 5)} WIB`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {operationalNote && (
                    <div
                      className={`bg-blue-50 border border-blue-100 rounded-lg p-5 transition-all duration-1000 ${
                        isOfficeHoursVisible
                          ? "translate-y-0 opacity-100"
                          : "translate-y-8 opacity-0"
                      }`}
                      style={{ transitionDelay: "600ms" }}>
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-blue-900 mb-1">
                            Catatan Penting
                          </h5>
                          <p className="text-blue-800 text-sm leading-relaxed">
                            {operationalNote}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Address & Map Section */}
      <section ref={addressRef} className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className={`text-center mb-12 transition-all duration-1000 ${
              isAddressVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-16 opacity-0"
            }`}>
            <div className="inline-block px-4 py-2 bg-red-50 border border-red-100 rounded-md mb-4">
              <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
                Lokasi Kami
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Alamat & Peta Lokasi
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Temukan kami di lokasi berikut
            </p>
          </div>

          {bodyStatus === "loading" && (
            <div className="flex flex-col justify-center items-center py-16">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
                <div className="absolute inset-0 border-4 border-blue-700 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-gray-600 font-medium">Memuat lokasi...</p>
            </div>
          )}

          {bodyStatus === "failed" && (
            <div className="text-center py-16">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
                <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
                <div className="text-red-700 text-lg font-semibold mb-2">
                  Gagal memuat lokasi
                </div>
                <p className="text-red-600 text-sm">
                  Terjadi kesalahan saat memuat data alamat.
                </p>
              </div>
            </div>
          )}

          {bodyStatus === "succeeded" && !body?.address && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Alamat belum tersedia
              </h3>
              <p className="text-gray-600 text-sm">
                Informasi lokasi akan segera ditambahkan
              </p>
            </div>
          )}

          {bodyStatus === "succeeded" && body?.address && (
            <div className="grid lg:grid-cols-2 gap-8">
              <div
                className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-1000 ${
                  isAddressVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-16 opacity-0"
                }`}
                style={{ transitionDelay: "200ms" }}>
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-7 h-7 text-white" />
                    <h3 className="text-xl font-bold text-white">
                      Alamat Lengkap
                    </h3>
                  </div>
                </div>

                <div className="p-8">
                  <div
                    className="prose prose-sm max-w-none text-gray-700 mb-6 force-light"
                    dangerouslySetInnerHTML={{ __html: body.address }}
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    {body?.google_map_link && (
                      <a
                        href={body.google_map_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors">
                        <Navigation className="w-4 h-4" />
                        Buka di Maps
                      </a>
                    )}

                    <button
                      onClick={handleCopyAddress}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors">
                      {copiedAddress ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Alamat Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Salin Alamat</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {body?.google_map_link && (
                <div
                  className={`bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-1000 ${
                    isAddressVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-16 opacity-0"
                  }`}
                  style={{ transitionDelay: "400ms" }}>
                  <div className="h-full min-h-[500px]">
                    <iframe
                      src={getEmbedUrl(body.google_map_link)}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="rounded-lg"
                      title="Location Map"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
