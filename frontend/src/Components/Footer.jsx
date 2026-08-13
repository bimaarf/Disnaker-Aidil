import {
  Mail,
  MessageCircle,
  Instagram,
  Heart,
  MapPin,
  Phone,
} from "lucide-react";
import React from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

export const Footer = () => {
  const { contacts } = useSelector((state) => state.contacts);
  const logo = useSelector((state) => state.logos.logos);
  const services = useSelector((state) => state.services.services);

  return (
    <footer className="bg-[#2a2a2a] text-white relative overflow-hidden">
      {/* Subtle Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-600"></div>

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-start gap-3 mb-6">
                {logo?.image ? (
                  <img
                    src={logo.image}
                    alt="Logo Dinas Ketenagakerjaan"
                    className="w-16 h-16 object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Heart className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold leading-tight mb-1">
                    Dinas Ketenagakerjaan
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Kota Balikpapan
                  </p>
                </div>
              </div>

              {/* App Title & Body from Logo State */}
              {logo?.app_title && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">
                    {logo.app_title}
                  </h4>
                </div>
              )}

              {logo?.app_body ? (
                <div
                  className="text-sm text-gray-300 leading-relaxed prose prose-sm prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: logo.app_body }}
                />
              ) : (
                <p className="text-sm text-gray-300 leading-relaxed">
                  Platform resmi pemerintah untuk layanan ketenagakerjaan yang
                  terintegrasi, melayani pencari kerja, perusahaan, dan
                  masyarakat secara profesional dan transparan.
                </p>
              )}
            </div>

            {/* Services Section */}
            <div>
              <h3 className="text-base font-bold mb-4 pb-2 border-b-2 border-gray-600 inline-block">
                Layanan Kami
              </h3>
              <ul className="space-y-2.5">
                {services?.slice(0, 6).map((item) => (
                  <li key={item.id}>
                    <a
                      href="#layanan"
                      className="text-sm text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                      <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:w-1.5 group-hover:h-1.5 transition-all duration-200" />
                      <span className="line-clamp-1">{item.title}</span>
                    </a>
                  </li>
                ))}
                {services?.length > 6 && (
                  <li>
                    <a
                      href="#layanan"
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-2 font-medium">
                      <span>Lihat Semua Layanan →</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-base font-bold mb-4 pb-2 border-b-2 border-gray-600 inline-block">
                Tautan Cepat
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    to="/about"
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:w-1.5 group-hover:h-1.5 transition-all duration-200" />
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blogs"
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:w-1.5 group-hover:h-1.5 transition-all duration-200" />
                    Pengumuman
                  </Link>
                </li>
                <li>
                  <Link
                    to="/gallery"
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:w-1.5 group-hover:h-1.5 transition-all duration-200" />
                    Galeri
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact-us"
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-2 group">
                    <span className="w-1 h-1 bg-gray-500 rounded-full group-hover:w-1.5 group-hover:h-1.5 transition-all duration-200" />
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-base font-bold mb-4 pb-2 border-b-2 border-gray-600 inline-block">
                Hubungi Kami
              </h3>
              <div className="space-y-3">
                {contacts?.address && (
                  <div className="flex items-start gap-3 group">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-600 transition-colors duration-200">
                      <MapPin className="w-4 h-4 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed flex-1">
                      {contacts.address}
                    </p>
                  </div>
                )}

                {contacts?.phone && (
                  <div className="flex items-start gap-3 group">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-600 transition-colors duration-200">
                      <Phone className="w-4 h-4 text-gray-300" />
                    </div>
                    <a
                      href={`tel:${contacts.phone}`}
                      className="text-sm text-gray-300 hover:text-white transition-colors duration-200 flex-1">
                      {contacts.phone}
                    </a>
                  </div>
                )}

                {contacts?.email && (
                  <div className="flex items-start gap-3 group">
                    <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-600 transition-colors duration-200">
                      <Mail className="w-4 h-4 text-gray-300" />
                    </div>
                    <a
                      href={`mailto:${contacts.email}`}
                      className="text-sm text-gray-300 hover:text-white transition-colors duration-200 break-all flex-1">
                      {contacts.email}
                    </a>
                  </div>
                )}

                {/* Social Media Links */}
                {(contacts?.whatsapp ||
                  contacts?.instagram ||
                  contacts?.telegram) && (
                  <div className="pt-3 mt-3 border-t border-gray-700">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      Media Sosial
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {contacts?.whatsapp && (
                        <a
                          href={`https://wa.me/${contacts.whatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-gray-700 hover:bg-green-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                          title="WhatsApp">
                          <MessageCircle className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                        </a>
                      )}

                      {contacts?.instagram && (
                        <a
                          href={`https://instagram.com/${contacts.instagram.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-gray-700 hover:bg-pink-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                          title="Instagram">
                          <Instagram className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                        </a>
                      )}

                      {contacts?.telegram && (
                        <a
                          href={`https://t.me/${contacts.telegram.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-9 h-9 bg-gray-700 hover:bg-blue-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                          title="Telegram">
                          <MessageCircle className="w-4 h-4 text-gray-300 group-hover:text-white transition-colors" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 bg-[#222222]">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-400 text-center md:text-left">
                &copy; {new Date().getFullYear()} Dinas Ketenagakerjaan Kota
                Balikpapan.
                <span className="hidden md:inline">
                  {" "}
                  Semua hak cipta dilindungi.
                </span>
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Dibuat dengan</span>
                <Heart className="w-3.5 h-3.5 text-gray-500 fill-gray-500" />
                <span>untuk melayani masyarakat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
