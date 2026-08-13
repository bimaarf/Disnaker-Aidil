import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, FileText, Star, ArrowRight, CheckCircle, AlertCircle, Heart, Trophy, BookOpen, GraduationCap } from 'lucide-react';

const RegistrationPortalBc = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');

  // Mock data untuk periode pendaftaran
  const registrationPeriods = [
    {
      id: 1,
      title: "Pendaftaran Gelombang 1 - PPDB 2024",
      description: "Pendaftaran awal dengan benefit khusus dan potongan biaya administrasi",
      price: 500000,
      originalPrice: 750000,
      status: true,
      category: { name: "Gelombang Awal" },
      startDate: "2024-01-15",
      endDate: "2024-03-15",
      totalQuestions: 25,
      totalRespondents: 1250,
      estimatedTime: "45 menit",
      benefits: [
        "Potongan biaya administrasi 33%",
        "Prioritas pemilihan kelas",
        "Bebas biaya seragam sekolah",
        "Konsultasi gratis dengan counselor"
      ],
      requirements: [
        "Ijazah SMP/MTs",
        "Rapor semester 1-5",
        "Surat Keterangan Kelakuan Baik",
        "Pas foto 3x4 (3 lembar)"
      ],
      isPopular: true,
      badge: "HEMAT 33%"
    },
    {
      id: 2,
      title: "Pendaftaran Gelombang 2 - PPDB 2024",
      description: "Periode pendaftaran reguler dengan fasilitas lengkap dan bimbingan intensif",
      price: 650000,
      originalPrice: 750000,
      status: true,
      category: { name: "Gelombang Reguler" },
      startDate: "2024-03-16",
      endDate: "2024-05-30",
      totalQuestions: 28,
      totalRespondents: 890,
      estimatedTime: "50 menit",
      benefits: [
        "Potongan biaya administrasi 13%",
        "Bimbingan persiapan tes masuk",
        "Akses ke perpustakaan digital",
        "Workshop soft skills"
      ],
      requirements: [
        "Ijazah SMP/MTs",
        "Rapor semester 1-5",
        "Surat Keterangan Kelakuan Baik",
        "Pas foto 3x4 (3 lembar)",
        "Sertifikat prestasi (jika ada)"
      ],
      isPopular: false,
      badge: "HEMAT 13%"
    },
    {
      id: 3,
      title: "Pendaftaran Gelombang Akhir - PPDB 2024",
      description: "Kesempatan terakhir untuk bergabung dengan program unggulan sekolah",
      price: 750000,
      originalPrice: 750000,
      status: true,
      category: { name: "Gelombang Akhir" },
      startDate: "2024-06-01",
      endDate: "2024-07-15",
      totalQuestions: 30,
      totalRespondents: 445,
      estimatedTime: "55 menit",
      benefits: [
        "Program akselerasi pembelajaran",
        "Mentoring individual",
        "Akses penuh fasilitas sekolah",
        "Program ekstrakurikuler premium"
      ],
      requirements: [
        "Ijazah SMP/MTs",
        "Rapor semester 1-5",
        "Surat Keterangan Kelakuan Baik",
        "Pas foto 3x4 (3 lembar)",
        "Surat keterangan kesehatan"
      ],
      isPopular: false,
      badge: "TERAKHIR"
    },
    {
      id: 4,
      title: "Pendaftaran Kelas Unggulan - PPDB 2024",
      description: "Program khusus untuk siswa berprestasi dengan kurikulum internasional",
      price: 1200000,
      originalPrice: 1500000,
      status: false,
      category: { name: "Program Khusus" },
      startDate: "2024-02-01",
      endDate: "2024-04-30",
      totalQuestions: 35,
      totalRespondents: 234,
      estimatedTime: "60 menit",
      benefits: [
        "Kurikulum Cambridge",
        "Native speaker teachers",
        "Laptop gratis untuk belajar",
        "Study tour ke luar negeri"
      ],
      requirements: [
        "Rapor dengan rata-rata min. 8.5",
        "Sertifikat prestasi akademik",
        "Tes psikologi",
        "Interview dengan orang tua"
      ],
      isPopular: true,
      badge: "PREMIUM"
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredPeriods = registrationPeriods.filter(period => {
    const matchesSearch = period.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         period.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'available') return matchesSearch && period.status;
    if (filter === 'closed') return matchesSearch && !period.status;
    if (filter === 'popular') return matchesSearch && period.isPopular;
    
    return matchesSearch;
  });

  const handleRegister = (period) => {
    setSelectedPeriod(period);
    setShowModal(true);
  };

  const RegistrationModal = () => {
    if (!selectedPeriod) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedPeriod.title}</h3>
                <p className="text-gray-600">{selectedPeriod.description}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Biaya Pendaftaran</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-indigo-600">{formatPrice(selectedPeriod.price)}</span>
                    {selectedPeriod.originalPrice > selectedPeriod.price && (
                      <span className="text-lg text-gray-400 line-through">{formatPrice(selectedPeriod.originalPrice)}</span>
                    )}
                  </div>
                </div>
                {selectedPeriod.badge && (
                  <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {selectedPeriod.badge}
                  </span>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Keuntungan Bergabung
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedPeriod.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Dokumen yang Diperlukan
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {selectedPeriod.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700 text-sm">{requirement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Tutup
              </button>
              <button
                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all transform hover:scale-105 font-medium flex items-center justify-center gap-2"
                disabled={!selectedPeriod.status}
              >
                {selectedPeriod.status ? (
                  <>
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  'Pendaftaran Ditutup'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Portal Pendaftaran Siswa Baru
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Bergabunglah dengan ribuan siswa lainnya dan wujudkan impian pendidikan terbaikmu!
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-center">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6" />
                <span className="text-lg">2,800+ Siswa Terdaftar</span>
              </div>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                <span className="text-lg">95% Tingkat Kelulusan</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-6 h-6" />
                <span className="text-lg">Akreditasi A</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari program pendaftaran..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'Semua', icon: BookOpen },
                { key: 'available', label: 'Tersedia', icon: CheckCircle },
                { key: 'popular', label: 'Populer', icon: Heart },
                { key: 'closed', label: 'Ditutup', icon: AlertCircle }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                    filter === key
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Period Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredPeriods.map((period) => {
            const daysRemaining = getDaysRemaining(period.endDate);
            const isUrgent = daysRemaining <= 7 && daysRemaining > 0;
            const isExpired = daysRemaining <= 0;

            return (
              <div key={period.id} className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden ${
                period.isPopular ? 'ring-2 ring-yellow-400' : ''
              }`}>
                {/* Header */}
                <div className="relative">
                  <div className={`h-2 ${period.status ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gray-300'}`}></div>
                  {period.isPopular && (
                    <div className="absolute -top-1 right-4">
                      <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-b-lg text-xs font-bold flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        POPULER
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Badge and Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-2">
                      {period.badge && (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          period.badge.includes('HEMAT') ? 'bg-red-100 text-red-600' :
                          period.badge === 'PREMIUM' ? 'bg-purple-100 text-purple-600' :
                          'bg-orange-100 text-orange-600'
                        }`}>
                          {period.badge}
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        period.status 
                          ? 'bg-green-100 text-green-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {period.status ? 'Dibuka' : 'Ditutup'}
                      </span>
                    </div>
                    {isUrgent && period.status && (
                      <div className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-xs font-medium flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {daysRemaining} hari lagi
                      </div>
                    )}
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{period.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{period.description}</p>

                  {/* Price */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Biaya Pendaftaran</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-indigo-600">{formatPrice(period.price)}</span>
                          {period.originalPrice > period.price && (
                            <span className="text-sm text-gray-400 line-through">{formatPrice(period.originalPrice)}</span>
                          )}
                        </div>
                      </div>
                      {period.originalPrice > period.price && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Hemat</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatPrice(period.originalPrice - period.price)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-medium">Periode</p>
                        <p>{formatDate(period.startDate)} - {formatDate(period.endDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4 text-green-500" />
                      <div>
                        <p className="font-medium">Estimasi Waktu</p>
                        <p>{period.estimatedTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="font-medium">Pertanyaan</p>
                        <p>{period.totalQuestions} pertanyaan</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-orange-500" />
                      <div>
                        <p className="font-medium">Pendaftar</p>
                        <p>{period.totalRespondents.toLocaleString()} siswa</p>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleRegister(period)}
                      disabled={!period.status}
                      className={`w-full py-3 px-4 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                        period.status
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {period.status ? (
                        <>
                          Daftar Sekarang
                          <ArrowRight className="w-5 h-5" />
                        </>
                      ) : (
                        'Pendaftaran Ditutup'
                      )}
                    </button>
                    
                    <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                      Lihat Detail Program
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPeriods.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Tidak Ada Program Ditemukan</h3>
              <p className="text-gray-600 mb-4">Coba ubah kata kunci pencarian atau filter yang dipilih.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Reset Pencarian
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && <RegistrationModal />}

      {/* Footer CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Siap Memulai Perjalanan Pendidikanmu?
          </h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan siswa yang telah mempercayakan masa depan mereka bersama kami.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors">
              Hubungi Kami
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white hover:text-blue-600 transition-colors">
              Download Brosur
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPortalBc;