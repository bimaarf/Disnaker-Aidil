import React, { memo, useMemo } from "react";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import {
  FileText,
  Users,
  CheckCircle,
  Award,
} from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AssignmentDashboard = ({ assignments }) => {
  // Process data dari assignments prop
  const chartData = useMemo(() => {
    if (!assignments || assignments.length === 0) {
      return {
        submissionStatus: { labels: [], datasets: [] },
        gradeDistribution: { labels: [], datasets: [] },
        assignmentTypes: { labels: [], datasets: [] },
        performanceTrend: { labels: [], datasets: [] },
      };
    }

    // 1. Status Submission Chart
    const submissionStatusData = assignments.reduce((acc, assignment) => {
      assignment.submissions.forEach((submission) => {
        acc[submission.status] = (acc[submission.status] || 0) + 1;
      });
      return acc;
    }, {});

    const statusLabels = {
      graded: "Sudah Dinilai",
      submitted: "Sudah Dikumpul",
      pending: "Menunggu",
      late: "Terlambat",
    };

    const submissionStatus = {
      labels: Object.keys(submissionStatusData).map(
        (status) => statusLabels[status] || status
      ),
      datasets: [
        {
          data: Object.values(submissionStatusData),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)", // green for graded
            "rgba(59, 130, 246, 0.8)", // blue for submitted
            "rgba(251, 191, 36, 0.8)", // yellow for pending
            "rgba(239, 68, 68, 0.8)", // red for late
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(251, 191, 36, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };

    // 2. Grade Distribution Chart
    const grades = assignments.flatMap((assignment) =>
      assignment.submissions
        .filter((sub) => sub.points !== null)
        .map((sub) => sub.points)
    );

    const gradeRanges = {
      "90-100": grades.filter((g) => g >= 90 && g <= 100).length,
      "80-89": grades.filter((g) => g >= 80 && g < 90).length,
      "70-79": grades.filter((g) => g >= 70 && g < 80).length,
      "60-69": grades.filter((g) => g >= 60 && g < 70).length,
      "< 60": grades.filter((g) => g < 60).length,
    };

    const gradeDistribution = {
      labels: Object.keys(gradeRanges),
      datasets: [
        {
          label: "Jumlah Siswa",
          data: Object.values(gradeRanges),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)", // A
            "rgba(59, 130, 246, 0.8)", // B
            "rgba(251, 191, 36, 0.8)", // C
            "rgba(249, 115, 22, 0.8)", // D
            "rgba(239, 68, 68, 0.8)", // F
          ],
          borderColor: [
            "rgba(34, 197, 94, 1)",
            "rgba(59, 130, 246, 1)",
            "rgba(251, 191, 36, 1)",
            "rgba(249, 115, 22, 1)",
            "rgba(239, 68, 68, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    // 3. Assignment Types Chart
    const typeCount = assignments.reduce((acc, assignment) => {
      acc[assignment.type] = (acc[assignment.type] || 0) + 1;
      return acc;
    }, {});

    const typeLabels = {
      document: "Dokumen",
      video: "Video",
      link: "Link",
      assignment: "Tugas",
      quiz: "Kuis",
    };

    const assignmentTypes = {
      labels: Object.keys(typeCount).map((type) => typeLabels[type] || type),
      datasets: [
        {
          data: Object.values(typeCount),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)", // blue
            "rgba(239, 68, 68, 0.8)", // red
            "rgba(34, 197, 94, 0.8)", // green
            "rgba(168, 85, 247, 0.8)", // purple
            "rgba(251, 191, 36, 0.8)", // yellow
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(34, 197, 94, 1)",
            "rgba(168, 85, 247, 1)",
            "rgba(251, 191, 36, 1)",
          ],
          borderWidth: 2,
        },
      ],
    };

    // 4. Performance Trend Chart
    const sortedAssignments = [...assignments].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    const performanceTrend = {
      labels: sortedAssignments.map((assignment) => assignment.title),
      datasets: [
        {
          label: "Rata-rata Nilai",
          data: sortedAssignments.map((assignment) => {
            const validSubmissions = assignment.submissions.filter(
              (sub) => sub.points !== null
            );
            if (validSubmissions.length === 0) return 0;
            const avg =
              validSubmissions.reduce((sum, sub) => sum + sub.points, 0) /
              validSubmissions.length;
            return Math.round(avg);
          }),
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    };

    return {
      submissionStatus,
      gradeDistribution,
      assignmentTypes,
      performanceTrend,
    };
  }, [assignments]);

  // Summary statistics
  const stats = useMemo(() => {
    if (!assignments || assignments.length === 0) {
      return {
        totalAssignments: 0,
        totalSubmissions: 0,
        avgGrade: 0,
        completionRate: 0,
      };
    }

    const totalAssignments = assignments.length;
    const allSubmissions = assignments.flatMap((a) => a.submissions);
    const totalSubmissions = allSubmissions.length;
    const gradedSubmissions = allSubmissions.filter((s) => s.points !== null);
    const avgGrade =
      gradedSubmissions.length > 0
        ? Math.round(
            gradedSubmissions.reduce((sum, s) => sum + s.points, 0) /
              gradedSubmissions.length
          )
        : 0;
    const completionRate =
      totalSubmissions > 0
        ? Math.round((gradedSubmissions.length / totalSubmissions) * 100)
        : 0;

    return {
      totalAssignments,
      totalSubmissions,
      avgGrade,
      completionRate,
    };
  }, [assignments]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard Analitik Assignment
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Visualisasi data performa assignment dan submission siswa
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-base-100 dark:bg-base-200 rounded-2xl p-6 shadow-lg border-l-4 border-blue-500">
          <div className="flex items-center">
            <FileText className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Assignment
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalAssignments}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-green-500 mr-4" />
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Total Submission
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalSubmissions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 rounded-2xl p-6 shadow-lg border-l-4 border-purple-500">
          <div className="flex items-center">
            <Award className="w-10 h-10 text-purple-500 mr-4" />
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Rata-rata Nilai
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgGrade}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center">
            <CheckCircle className="w-10 h-10 text-yellow-500 mr-4" />
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Tingkat Penyelesaian
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.completionRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Submission Status Chart */}
        <div className="bg-base-100 dark:bg-base-200 rounded-2xl p-6 shadow-lg">
          <Doughnut
            data={chartData.submissionStatus}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  ...chartOptions.plugins.title,
                  text: "Status Submission",
                },
              },
            }}
          />
        </div>

        {/* Grade Distribution Chart */}
        <div className="bg-base-100 dark:bg-base-200 rounded-2xl p-6 shadow-lg">
          <Bar
            data={chartData.gradeDistribution}
            options={{
              ...barOptions,
              plugins: {
                ...barOptions.plugins,
                title: {
                  ...barOptions.plugins.title,
                  text: "Distribusi Nilai",
                },
              },
            }}
          />
        </div>

        {/* Assignment Types Chart */}
        <div className="bg-base-100 dark:bg-base-200 rounded-2xl p-6 shadow-lg">
          <Doughnut
            data={chartData.assignmentTypes}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  ...chartOptions.plugins.title,
                  text: "Jenis Assignment",
                },
              },
            }}
          />
        </div>

        {/* Performance Trend Chart */}
        <div className="bg-base-100 dark:bg-base-200 rounded-2xl p-6 shadow-lg">
          <Line
            data={chartData.performanceTrend}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                title: {
                  ...chartOptions.plugins.title,
                  text: "Tren Performa Assignment",
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Component untuk menggunakan data dari JSON yang diberikan
const AssignmentChartPage = ({ assignments }) => {

  return <AssignmentDashboard assignments={assignments} />;
};

export default memo(AssignmentChartPage);
