import React, { useState } from "react";
import {
  Briefcase,
  Users,
  FileText,
  Info,
  Building2,
  Video,
  GraduationCap,
  X,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { truncateTextWords } from "../Context/__useTruncate";

export const Disnaker = () => {
  const [selectedService, setSelectedService] = useState(null);
  const [expandedSubItem, setExpandedSubItem] = useState(null);

  const services = [
    {
      title: "HALO PENTA",
      description:
        "Layanan konsultasi online terkait pelayanan di bidang Penempatan dan Perluasan Kerja",
      icon: Phone,
      color: "from-blue-500 to-cyan-500",
      link: "https://bit.ly/Halo-Penta",
      subItems: [
        {
          title: "Konsultasi Ketenagakerjaan",
          icon: Phone,
          description:
            "Layanan konsultasi online untuk pertanyaan seputar ketenagakerjaan",
          link: "https://bit.ly/Halo-Penta",
        },
        {
          title: "Informasi Perluasan Kerja",
          icon: Info,
          description: "Informasi terkait program perluasan kesempatan kerja",
          link: "https://bit.ly/Halo-Penta",
        },
        {
          title: "Bantuan Penempatan",
          icon: Users,
          description: "Bantuan dalam proses penempatan tenaga kerja",
          link: "https://bit.ly/Halo-Penta",
        },
      ],
    },
    {
      title: "KARTU PENCAKER",
      description:
        "Kartu tanda bukti pendaftaran pencari kerja yang dikeluarkan oleh Dinas Ketenagakerjaan Kota Balikpapan yang digunakan untuk melamar pekerjaan",
      icon: FileText,
      color: "from-purple-500 to-pink-500",
      link: "https://newnaker.balikpapan.go.id/pencaker/login",
      subItems: [
        {
          title: "Pendaftaran Kartu AK/I",
          icon: FileText,
          description: "Daftar untuk mendapatkan kartu pencari kerja baru",
          link: "https://newnaker.balikpapan.go.id/pencaker/login",
        },
        {
          title: "Perpanjangan Kartu",
          icon: FileText,
          description: "Perpanjang masa berlaku kartu pencari kerja Anda",
          link: "https://newnaker.balikpapan.go.id/pencaker/login",
        },
        {
          title: "Cetak Ulang Kartu",
          icon: FileText,
          description: "Cetak ulang kartu yang hilang atau rusak",
          link: "https://newnaker.balikpapan.go.id/pencaker/login",
        },
      ],
    },
    {
      title: "PELAPORAN TKA",
      description:
        "Lapor TKA adalah pelaporan yang dilakukan oleh perusahaan yang menggunakan Tenaga Kerja Asing di instansi tersebut",
      icon: Users,
      color: "from-orange-500 to-red-500",
      link: "http://103.144.82.150:8000",
      subItems: [
        {
          title: "Laporan Bulanan TKA",
          icon: FileText,
          description: "Pelaporan rutin bulanan penggunaan tenaga kerja asing",
          link: "http://103.144.82.150:8000",
        },
        {
          title: "Registrasi TKA Baru",
          icon: Users,
          description: "Pendaftaran tenaga kerja asing yang baru masuk",
          link: "http://103.144.82.150:8000",
        },
        {
          title: "Pembaruan Data TKA",
          icon: FileText,
          description: "Update informasi dan data tenaga kerja asing",
          link: "http://103.144.82.150:8000",
        },
      ],
    },
    {
      title: "INFO LOKER",
      description:
        "Berisikan informasi lowongan pekerjaan dari perusahaan-perusahaan yang membuka lowongan pekerjaan melalui Dinas Ketenagakerjaan Kota Balikpapan",
      icon: Info,
      color: "from-green-500 to-emerald-500",
      link: "https://newnaker.balikpapan.go.id/info-loker",
      subItems: [
        {
          title: "Lowongan Terbaru",
          icon: Info,
          description: "Daftar lowongan pekerjaan yang baru dipublikasikan",
          link: "https://newnaker.balikpapan.go.id/info-loker",
        },
        {
          title: "Lowongan Berdasarkan Bidang",
          icon: Briefcase,
          description: "Cari lowongan sesuai bidang keahlian Anda",
          link: "https://newnaker.balikpapan.go.id/info-loker",
        },
        {
          title: "Job Fair & Event",
          icon: Users,
          description: "Informasi bursa kerja dan acara rekrutmen",
          link: "https://newnaker.balikpapan.go.id/info-loker",
        },
      ],
    },
    {
      title: "PASANG LOKER",
      description:
        "Permohonan yang mengajukan permohonan kebutuhan Tenaga Kerja yang dibutuhkan",
      icon: Building2,
      color: "from-indigo-500 to-blue-500",
      link: "https://newnaker.balikpapan.go.id/perusahaan/login",
      subItems: [
        {
          title: "Posting Lowongan Baru",
          icon: Building2,
          description: "Pasang lowongan pekerjaan untuk perusahaan Anda",
          link: "https://newnaker.balikpapan.go.id/perusahaan/login",
        },
        {
          title: "Kelola Lowongan",
          icon: FileText,
          description: "Edit atau hapus lowongan yang sudah dipasang",
          link: "https://newnaker.balikpapan.go.id/perusahaan/login",
        },
        {
          title: "Database Pelamar",
          icon: Users,
          description: "Akses database pencari kerja yang melamar",
          link: "https://newnaker.balikpapan.go.id/perusahaan/login",
        },
      ],
    },
    {
      title: "BURSA KERJA ONLINE",
      description:
        "Bursa Kerja Online mempertemukan pencari kerja dengan pemberi kerja",
      icon: Video,
      color: "from-pink-500 to-rose-500",
      link: "https://newnaker.balikpapan.go.id/pencaker/login",
      subItems: [
        {
          title: "Video Interview",
          icon: Video,
          description: "Fasilitas wawancara online dengan perusahaan",
          link: "https://newnaker.balikpapan.go.id/pencaker/login",
        },
        {
          title: "Career Matching",
          icon: Users,
          description: "Sistem pencocokan otomatis pencari kerja dan lowongan",
          link: "https://newnaker.balikpapan.go.id/pencaker/login",
        },
        {
          title: "Virtual Job Fair",
          icon: Building2,
          description: "Bursa kerja online dengan berbagai perusahaan",
          link: "https://newnaker.balikpapan.go.id/pencaker/login",
        },
      ],
    },
    {
      title: "BKK",
      description:
        "Bursa Kerja Khusus untuk satuan pendidikan dan lembaga pelatihan",
      icon: GraduationCap,
      color: "from-teal-500 to-cyan-500",
      link: "https://newnaker.balikpapan.go.id/bkk/login",
      subItems: [
        {
          title: "Pendaftaran BKK",
          icon: GraduationCap,
          description: "Daftarkan satuan pendidikan sebagai BKK",
          link: "https://newnaker.balikpapan.go.id/bkk/login",
        },
        {
          title: "Alumni Job Placement",
          icon: Users,
          description: "Layanan penempatan kerja untuk alumni",
          link: "https://newnaker.balikpapan.go.id/bkk/login",
        },
        {
          title: "Pelatihan & Sertifikasi",
          icon: FileText,
          description: "Program pelatihan dan sertifikasi kompetensi",
          link: "https://newnaker.balikpapan.go.id/bkk/login",
        },
      ],
    },
  ];

  const stats = [
    { number: "10K+", label: "Pencari Kerja Terdaftar" },
    { number: "500+", label: "Perusahaan Partner" },
    { number: "2K+", label: "Lowongan Aktif" },
    { number: "95%", label: "Tingkat Kepuasan" },
  ];

  const handleServiceClick = (service) => {
    if (service.subItems && service.subItems.length > 0) {
      setSelectedService(service);
      setExpandedSubItem(null);
    } else {
      window.open(service.link, "_blank", "noopener,noreferrer");
    }
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setExpandedSubItem(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              Dinas Ketenagakerjaan Kota Balikpapan
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Membangun Masa Depan
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Karir Anda
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Platform terintegrasi untuk pencari kerja dan perusahaan di Kota
              Balikpapan. Temukan peluang karir atau talent terbaik dengan mudah
              dan cepat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#layanan"
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all">
                Jelajahi Layanan
              </a>
              <a
                href="https://newnaker.balikpapan.go.id/info-loker"
                className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all border-2 border-gray-200">
                Lihat Lowongan
              </a>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div
          className="absolute bottom-20 right-10 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ animationDelay: "1s" }}></div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="layanan" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Layanan Kami
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Berbagai layanan digital untuk memudahkan urusan ketenagakerjaan
              Anda
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <div
                  key={index}
                  onClick={() => handleServiceClick(service)}
                  className="group relative bg-white rounded-2xl p-6 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden cursor-pointer">
                  <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${service.color} opacity-10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>

                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </h4>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {truncateTextWords(service.description, 8)}
                  </p>

                  <div className="flex items-center text-blue-600 font-semibold group-hover:gap-2 transition-all">
                    {service.subItems && service.subItems.length > 0
                      ? "Lihat Layanan"
                      : "Akses Layanan"}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Modal */}
      {selectedService && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={handleCloseModal}>
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl transform animate-scaleIn"
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div
              className={`bg-gradient-to-r ${selectedService.color} p-6 rounded-t-3xl relative`}>
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
                <X className="w-6 h-6 text-white" />
              </button>

              <div className="flex items-start gap-4 text-white">
                {/* Container icon */}
                <div className="w-16 h-16 flex-shrink-0 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <div className="w-9 h-9 flex items-center justify-center">
                    {React.createElement(selectedService.icon, {
                      className: "w-full h-full",
                    })}
                  </div>
                </div>

                {/* Teks */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold">
                    {selectedService.title}
                  </h3>
                  <p className="text-white/90 mt-1">
                    {truncateTextWords(selectedService.description, 12)}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                Pilih Layanan:
              </h4>
              <div className="space-y-3">
                {selectedService.subItems?.map((subItem, index) => {
                  const SubIcon = subItem.icon;
                  const isExpanded = expandedSubItem === index;
                  return (
                    <div
                      key={index}
                      className="border-2 border-gray-100 rounded-xl overflow-hidden transition-all duration-300 hover:border-blue-200">
                      <button
                        onClick={() =>
                          setExpandedSubItem(isExpanded ? null : index)
                        }
                        className="w-full p-4 bg-gray-50 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 bg-gradient-to-br ${
                              selectedService.color
                            } rounded-lg flex items-center justify-center flex-shrink-0 transition-transform ${
                              isExpanded ? "scale-110" : ""
                            }`}>
                            <SubIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 text-left">
                            <h5 className="font-bold text-gray-900">
                              {subItem.title}
                            </h5>
                          </div>
                          <ChevronDown
                            className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="p-4 bg-white border-t-2 border-gray-100 animate-slideDown">
                          <p className="text-sm text-gray-600 leading-relaxed mb-4">
                            {subItem.description}
                          </p>
                          <a
                            href={subItem.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all">
                            Lihat Selengkapnya
                            <ChevronRight className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Siap Memulai Perjalanan Karir Anda?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Bergabunglah dengan ribuan pencari kerja dan ratusan perusahaan yang
            telah mempercayai layanan kami
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://newnaker.balikpapan.go.id/pencaker/login"
              className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-xl transform hover:-translate-y-1 transition-all">
              Daftar Sebagai Pencari Kerja
            </a>
            <a
              href="https://newnaker.balikpapan.go.id/perusahaan/login"
              className="px-8 py-4 bg-transparent text-white border-2 border-white rounded-xl font-semibold hover:bg-white hover:text-blue-600 transition-all">
              Daftar Sebagai Perusahaan
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-bold">DISNAKER</h4>
                  <p className="text-xs">Kota Balikpapan</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed">
                Dinas Tenaga Kerja Kota Balikpapan, melayani masyarakat dengan
                profesional dan berintegritas.
              </p>
            </div>

            <div>
              <h5 className="text-white font-bold mb-4">Kontak</h5>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">Balikpapan, Kalimantan Timur</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">Hubungi Kami</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">
                    info@disnaker.balikpapan.go.id
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-white font-bold mb-4">Tautan Cepat</h5>
              <div className="space-y-2">
                <a
                  href="https://newnaker.balikpapan.go.id/info-loker"
                  className="block text-sm hover:text-blue-400 transition-colors">
                  Info Lowongan
                </a>
                <a
                  href="https://newnaker.balikpapan.go.id/pencaker/login"
                  className="block text-sm hover:text-blue-400 transition-colors">
                  Kartu Pencaker
                </a>
                <a
                  href="https://bit.ly/Halo-Penta"
                  className="block text-sm hover:text-blue-400 transition-colors">
                  Halo Penta
                </a>
                <a
                  href="https://newnaker.balikpapan.go.id/bkk/login"
                  className="block text-sm hover:text-blue-400 transition-colors">
                  BKK
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>
              &copy; 2025 Dinas Tenaga Kerja Kota Balikpapan. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            max-height: 500px;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
