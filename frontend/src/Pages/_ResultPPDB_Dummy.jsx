import {
  AlertCircle,
  Award,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  Filter,
  PieChart,
  RefreshCw,
  School,
  Search,
  Target,
  TrendingUp,
  User,
  Users,
  XCircle
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

// Mock data - replace with actual Redux integration
const mockData = {
  data: Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    submission_id: `SUB${String(i + 1).padStart(6, "0")}`,
    user_name: `Siswa ${i + 1}`,
    user_email: `siswa${i + 1}@email.com`,
    user_phone_number: `0812345${String(i + 1).padStart(4, "0")}`,
    validation_status: {
      label: ["Lulus", "Tidak_Lulus", "Belum_Ditentukan"][i % 3],
      color: ["green", "red", "yellow"][i % 3],
    },
    result: {
      value: Math.floor(Math.random() * 200) + 250,
      minimum_value: 300,
    },
    period: {
      id: 1,
      title: "Penerimaan Siswa Baru 2024/2025",
    },
    created_at: new Date(
      2024,
      0,
      Math.floor(Math.random() * 30) + 1
    ).toISOString(),
  })),
  total: 500,
  total_visible: 485,
  total_hidden: 15,
  current_page: 1,
  last_page: 50,
  per_page: 10,
  status_totals: {
    Lulus: 185,
    Tidak_Lulus: 165,
    Belum_Ditentukan: 135,
    Belum_Diverifikasi: 15,
  },
};

const PublicResultsPage = () => {
  // State management
  const [data, setData] = useState(mockData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const perPage = 10;

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString || dateString === "N/A") return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // Mock API call - replace with actual fetchAnswerGroupPublic
  const fetchData = useCallback(
    async (page = 1, search = "", status = "all") => {
      setLoading(true);
      setError(null);

      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Filter mock data based on search and status
        let filteredData = mockData.data;

        if (search) {
          filteredData = filteredData.filter(
            (item) =>
              item.user_name.toLowerCase().includes(search.toLowerCase()) ||
              item.submission_id.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (status !== "all") {
          filteredData = filteredData.filter(
            (item) =>
              item.validation_status.label.toLowerCase() ===
              status.toLowerCase()
          );
        }

        // Paginate
        const startIndex = (page - 1) * perPage;
        const paginatedData = filteredData.slice(
          startIndex,
          startIndex + perPage
        );

        const result = {
          ...mockData,
          data: paginatedData,
          total: filteredData.length,
          current_page: page,
          last_page: Math.ceil(filteredData.length / perPage),
        };

        setData(result);
      } catch (err) {
        setError("Failed to load data");
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Initial load
  useEffect(() => {
    fetchData(1, searchQuery, statusFilter);
  }, [fetchData, searchQuery, statusFilter]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page, searchQuery, statusFilter);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Handle status filter
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const totalPages = data.last_page;
    const current = currentPage;
    const delta = 2;
    const range = [];

    for (
      let i = Math.max(2, current - delta);
      i <= Math.min(totalPages - 1, current + delta);
      i++
    ) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift("...");
    }
    if (current + delta < totalPages - 1) {
      range.push("...");
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  // Statistics cards data
  const statsCards = [
    {
      title: "Total Pendaftar",
      value: data.total,
      icon: Users,
      color: "blue",
      bgGradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Lulus",
      value: data.status_totals?.Lulus || 0,
      icon: CheckCircle,
      color: "green",
      bgGradient: "from-green-500 to-green-600",
    },
    {
      title: "Tidak Lulus",
      value: data.status_totals?.Tidak_Lulus || 0,
      icon: XCircle,
      color: "red",
      bgGradient: "from-red-500 to-red-600",
    },
    {
      title: "Belum Ditentukan",
      value: data.status_totals?.Belum_Ditentukan || 0,
      icon: AlertCircle,
      color: "yellow",
      bgGradient: "from-yellow-500 to-yellow-600",
    },
  ];

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
      switch (status?.toLowerCase()) {
        case "lulus":
          return { color: "green", icon: CheckCircle, text: "Lulus" };
        case "tidak_lulus":
          return { color: "red", icon: XCircle, text: "Tidak Lulus" };
        case "belum_ditentukan":
          return {
            color: "yellow",
            icon: AlertCircle,
            text: "Belum Ditentukan",
          };
        default:
          return { color: "gray", icon: AlertCircle, text: "Pending" };
      }
    };

    const config = getStatusConfig(status);
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-${config.color}-100 text-${config.color}-700 border border-${config.color}-200`}>
        <Icon className="w-4 h-4" />
        {config.text}
      </div>
    );
  };

  // Loading state
  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl border border-white/20">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-100/20 animate-pulse"></div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Memuat Data</h3>
          <p className="text-lg text-gray-600">
            Sedang mengambil hasil PPDB...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-pink-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-3xl p-12 shadow-2xl max-w-md border border-red-100">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Oops!</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => fetchData(currentPage, searchQuery, statusFilter)}
            className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-red-500/25">
            <RefreshCw className="w-5 h-5 inline mr-2" />
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-3xl mb-8 shadow-lg">
            <School className="w-6 h-6" />
            <span className="font-bold text-lg">Hasil PPDB</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            Pengumuman Hasil Seleksi
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Hasil penerimaan peserta didik baru tahun ajaran 2024/2025. Cek
            status kelulusan dengan mencari nama atau nomor pendaftaran Anda.
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className={`bg-gradient-to-r ${stat.bgGradient} p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-2">
                      {stat.title}
                    </p>
                    <p className="text-white text-4xl font-bold">
                      {stat.value}
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama siswa atau nomor pendaftaran..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center gap-2 px-6 py-4 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-200 font-semibold text-gray-700">
                <Filter className="w-5 h-5" />
                Filter Status
              </button>

              <button
                onClick={() =>
                  fetchData(currentPage, searchQuery, statusFilter)
                }
                disabled={loading}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-105">
                <RefreshCw
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Memuat..." : "Perbarui"}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                {[
                  { value: "all", label: "Semua Status", count: data.total },
                  {
                    value: "lulus",
                    label: "Lulus",
                    count: data.status_totals?.Lulus || 0,
                  },
                  {
                    value: "tidak_lulus",
                    label: "Tidak Lulus",
                    count: data.status_totals?.Tidak_Lulus || 0,
                  },
                  {
                    value: "belum_ditentukan",
                    label: "Belum Ditentukan",
                    count: data.status_totals?.Belum_Ditentukan || 0,
                  },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => handleStatusFilter(filter.value)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      statusFilter === filter.value
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}>
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        {data.data.length > 0 ? (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 mb-8">
            <div className="p-8 border-b border-gray-200">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Daftar Hasil Seleksi
              </h2>
              <p className="text-gray-600">
                Menampilkan {data.data.length} dari {data.total} peserta
                (Halaman {currentPage} dari {data.last_page})
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Peserta
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      No. Pendaftaran
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Nilai
                    </th>
                    <th className="px-8 py-6 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Tanggal Daftar
                    </th>
                    <th className="px-8 py-6 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.data.map((student, index) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-8 py-6 text-sm font-medium text-gray-900">
                        {(currentPage - 1) * perPage + index + 1}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-lg">
                              {student.user_name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {student.user_email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="font-mono text-sm bg-gray-100 text-gray-800 px-3 py-2 rounded-lg inline-block">
                          {student.submission_id}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <StatusBadge status={student.validation_status.label} />
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-lg font-bold text-gray-800">
                          {student.result?.value || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600">
                          Min: {student.result?.minimum_value || 300}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="text-sm text-gray-600">
                          {formatDate(student.created_at)}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25">
                          <Eye className="w-4 h-4" />
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center border border-gray-100 mb-8">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-8">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Tidak Ada Data
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery || statusFilter !== "all"
                ? "Tidak ada hasil yang sesuai dengan pencarian Anda."
                : "Belum ada data hasil seleksi yang tersedia."}
            </p>
            {(searchQuery || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105">
                Reset Pencarian
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {data.last_page > 1 && (
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-gray-600">
                Menampilkan {(currentPage - 1) * perPage + 1} -{" "}
                {Math.min(currentPage * perPage, data.total)} dari {data.total}{" "}
                hasil
              </div>

              <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-xl transition-all duration-200">
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPaginationNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="px-3 py-2 text-gray-500">...</span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                          className={`px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                            currentPage === page
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                          }`}>
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Next Button */}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === data.last_page || loading}
                  className="inline-flex items-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium rounded-xl transition-all duration-200">
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Student Detail Modal */}
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">
                    Detail Peserta
                  </h3>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <XCircle className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-500" />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-800">
                          {selectedStudent.user_name}
                        </h4>
                        <p className="text-gray-600">
                          {selectedStudent.user_email}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <label className="text-sm font-medium text-gray-600">
                          No. Pendaftaran
                        </label>
                        <p className="text-lg font-bold text-gray-800">
                          {selectedStudent.submission_id}
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <label className="text-sm font-medium text-gray-600">
                          No. Telepon
                        </label>
                        <p className="text-lg font-bold text-gray-800">
                          {selectedStudent.user_phone_number}
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <label className="text-sm font-medium text-gray-600">
                          Tanggal Pendaftaran
                        </label>
                        <p className="text-lg font-bold text-gray-800">
                          {formatDate(selectedStudent.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100">
                      <div className="flex items-center gap-3 mb-4">
                        <Award className="w-6 h-6 text-blue-600" />
                        <h5 className="text-xl font-bold text-gray-800">
                          Status Kelulusan
                        </h5>
                      </div>
                      <div className="mb-4">
                        <StatusBadge
                          status={selectedStudent.validation_status.label}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Nilai Total</span>
                          <span className="text-2xl font-bold text-gray-800">
                            {selectedStudent.result?.value || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Nilai Minimum</span>
                          <span className="text-lg font-semibold text-gray-700">
                            {selectedStudent.result?.minimum_value || 300}
                          </span>
                        </div>

                        {selectedStudent.result?.value && (
                          <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-1000"
                                // Lanjutan dari kode sebelumnya - bagian yang belum selesai:

                                style={{
                                  width: `${Math.min(
                                    (selectedStudent.result.value /
                                      selectedStudent.result.minimum_value) *
                                      100,
                                    100
                                  )}%`,
                                }}></div>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600 mt-2">
                              <span>0</span>
                              <span>
                                {selectedStudent.result.minimum_value}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl">
                      <div className="flex items-center gap-3 mb-4">
                        <School className="w-6 h-6 text-gray-600" />
                        <h5 className="text-xl font-bold text-gray-800">
                          Periode Pendaftaran
                        </h5>
                      </div>
                      <p className="text-lg text-gray-700">
                        {selectedStudent.period?.title}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-4">
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200">
                    Tutup
                  </button>
                  <button
                    onClick={() => {
                      // Implementasi download sertifikat atau detail
                      console.log(
                        "Download detail for:",
                        selectedStudent.submission_id
                      );
                    }}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105">
                    <Download className="w-4 h-4" />
                    Download Detail
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <School className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-gray-800 text-lg">
                    Sistem PPDB Online
                  </h4>
                  <p className="text-gray-600">
                    Penerimaan Peserta Didik Baru 2024/2025
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    Terakhir diperbarui:{" "}
                    {new Date().toLocaleDateString("id-ID")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Total: {data.total} pendaftar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Statistics Section */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Grafik Status */}
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="w-6 h-6 text-blue-600" />
              <h3 className="text-2xl font-bold text-gray-800">
                Distribusi Status
              </h3>
            </div>

            <div className="space-y-4">
              {[
                {
                  label: "Lulus",
                  count: data.status_totals?.Lulus || 0,
                  color: "green",
                  percentage: (
                    ((data.status_totals?.Lulus || 0) / data.total) *
                    100
                  ).toFixed(1),
                },
                {
                  label: "Tidak Lulus",
                  count: data.status_totals?.Tidak_Lulus || 0,
                  color: "red",
                  percentage: (
                    ((data.status_totals?.Tidak_Lulus || 0) / data.total) *
                    100
                  ).toFixed(1),
                },
                {
                  label: "Belum Ditentukan",
                  count: data.status_totals?.Belum_Ditentukan || 0,
                  color: "yellow",
                  percentage: (
                    ((data.status_totals?.Belum_Ditentukan || 0) / data.total) *
                    100
                  ).toFixed(1),
                },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700">
                        {item.label}
                      </span>
                      <span className="text-sm text-gray-600">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full bg-${item.color}-500 transition-all duration-1000`}
                        style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-6 border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-blue-600" />
                <h4 className="font-bold text-gray-800">Tingkat Kelulusan</h4>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {(
                  ((data.status_totals?.Lulus || 0) / data.total) *
                  100
                ).toFixed(1)}
                %
              </div>
              <p className="text-sm text-gray-600">
                {data.status_totals?.Lulus || 0} dari {data.total} peserta
                dinyatakan lulus
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-6 border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h4 className="font-bold text-gray-800">Status Terkini</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Sudah Diverifikasi
                  </span>
                  <span className="font-semibold text-green-600">
                    {data.total_visible}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Menunggu Verifikasi
                  </span>
                  <span className="font-semibold text-yellow-600">
                    {data.total_hidden}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicResultsPage;
