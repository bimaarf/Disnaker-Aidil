import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { CalendarDays, Clock, TrendingUp, Users } from "lucide-react";
import React, { memo, useMemo } from "react";
import { Bar, Doughnut, Line, Pie } from "react-chartjs-2";

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

const AssignmentChartsPage = ({ assignments }) => {
  // Process data for charts
  const chartData = useMemo(() => {
    if (!assignments || assignments.length === 0) {
      return {
        scorePercentage: { labels: [], datasets: [] },
        submissionCount: { labels: [], datasets: [] },
        assignmentTypes: { labels: [], datasets: [] },
        submissionStatus: { labels: [], datasets: [] },
        scoreTrend: { labels: [], datasets: [] },
      };
    }

    // Sort assignments by created_at for trend chart
    const sortedAssignments = [...assignments].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    // 1. Score Percentage Chart
    const scorePercentageData = {
      labels: assignments.map((assignment) => assignment.title),
      datasets: [
        {
          label: "Persentase Nilai (%)",
          data: assignments.map((assignment) => {
            const submission = assignment.submissions[0];
            return submission ? (submission.points / submission.max_points) * 100 : 0;
          }),
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };

    // 2. Submission Count Chart
    const submissionCountData = {
      labels: assignments.map((assignment) => assignment.title),
      datasets: [
        {
          label: "Submitted",
          data: assignments.map((assignment) => assignment.submissions.length),
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Graded",
          data: assignments.map((assignment) => 
            assignment.submissions.filter((sub) => sub.status === "graded").length
          ),
          backgroundColor: "rgba(255, 206, 86, 0.5)",
          borderColor: "rgba(255, 206, 86, 1)",
          borderWidth: 1,
        },
      ],
    };

    // 3. Assignment Types Chart
    const typeCounts = assignments.reduce((acc, assignment) => {
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

    const assignmentTypesData = {
      labels: Object.keys(typeCounts).map((type) => typeLabels[type] || type),
      datasets: [
        {
          data: Object.values(typeCounts),
          backgroundColor: [
            "rgba(54, 162, 235, 0.5)",
            "rgba(255, 99, 132, 0.5)",
            "rgba(255, 206, 86, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(153, 102, 255, 0.5)",
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(255, 99, 132, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    // 4. Submission Status Chart
    const allSubmissions = assignments.flatMap((assignment) => assignment.submissions);
    const statusCounts = allSubmissions.reduce((acc, submission) => {
      acc[submission.status] = (acc[submission.status] || 0) + 1;
      return acc;
    }, {});

    const statusLabels = {
      submitted: "Submitted",
      graded: "Graded",
      // Add more statuses if needed
    };

    const submissionStatusData = {
      labels: Object.keys(statusCounts).map(
        (status) => statusLabels[status] || status
      ),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: [
            "rgba(54, 162, 235, 0.5)",
            "rgba(75, 192, 192, 0.5)",
            "rgba(153, 102, 255, 0.5)",
            "rgba(255, 99, 132, 0.5)",
          ],
          borderColor: [
            "rgba(54, 162, 235, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 99, 132, 1)",
          ],
          borderWidth: 1,
        },
      ],
    };

    // 5. Score Trend Chart
    const scoreTrendData = {
      labels: sortedAssignments.map((assignment) =>
        new Date(assignment.created_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        })
      ),
      datasets: [
        {
          label: "Persentase Nilai",
          data: sortedAssignments.map((assignment) => {
            const submission = assignment.submissions[0];
            return submission ? (submission.points / submission.max_points) * 100 : 0;
          }),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    };

    return {
      scorePercentage: scorePercentageData,
      submissionCount: submissionCountData,
      assignmentTypes: assignmentTypesData,
      submissionStatus: submissionStatusData,
      scoreTrend: scoreTrendData,
    };
  }, [assignments]);

  // Chart options
  const barOptions = {
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
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right",
      },
      title: {
        display: true,
        font: {
          size: 16,
        },
      },
    },
  };

  const lineOptions = {
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
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: "Persentase (%)",
        },
      },
    },
  };

  // Summary statistics
  const stats = useMemo(() => {
    if (!assignments || assignments.length === 0) {
      return {
        totalAssignments: 0,
        avgScore: 0,
        totalSubmissions: 0,
        openAssignments: 0,
      };
    }

    const totalAssignments = assignments.length;
    const allSubmissions = assignments.flatMap((assignment) => assignment.submissions);
    const avgScore =
      allSubmissions.reduce((sum, sub) => sum + (sub.points / sub.max_points) * 100, 0) /
      allSubmissions.length;
    const totalSubmissions = allSubmissions.length;
    const openAssignments = assignments.filter(
      (assignment) => !assignment.available_until || new Date(assignment.available_until) > new Date()
    ).length;

    return {
      totalAssignments,
      avgScore: Math.round(avgScore),
      totalSubmissions,
      openAssignments,
    };
  }, [assignments]);

  if (!assignments || assignments.length === 0) {
    return (
      <div className="mx-auto p-6">
        <div className="text-center py-12">
          <CalendarDays className="w-16 h-16 mx-auto text-base-content/40 mb-4" />
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Tidak Ada Data
          </h2>
          <p className="text-base-content/60">
            Belum ada data assignment untuk ditampilkan
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="mx-auto text-base-content">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <CalendarDays className="w-10 h-10 text-blue-500 mr-4" />
            <div>
              <p className="text-base-content text-sm">Total Assignments</p>
              <p className="text-2xl font-bold">{stats.totalAssignments}</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <TrendingUp className="w-10 h-10 text-green-500 mr-4" />
            <div>
              <p className="text-base-content text-sm">Rata-rata Nilai</p>
              <p className="text-2xl font-bold">{stats.avgScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-purple-500 mr-4" />
            <div>
              <p className="text-base-content text-sm">Total Submissions</p>
              <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <Clock className="w-10 h-10 text-yellow-500 mr-4" />
            <div>
              <p className="text-base-content text-sm">Assignments Terbuka</p>
              <p className="text-2xl font-bold">{stats.openAssignments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Percentage Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <Bar
            data={chartData.scorePercentage}
            options={{
              ...barOptions,
              plugins: {
                ...barOptions.plugins,
                title: {
                  ...barOptions.plugins.title,
                  text: "Persentase Nilai per Assignment",
                },
              },
              scales: {
                ...barOptions.scales,
                y: {
                  ...barOptions.scales.y,
                  max: 100,
                  title: {
                    ...barOptions.scales.y.title,
                    text: "Persentase (%)",
                  },
                },
              },
            }}
          />
        </div>

        {/* Submission Count Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <Bar
            data={chartData.submissionCount}
            options={{
              ...barOptions,
              plugins: {
                ...barOptions.plugins,
                title: {
                  ...barOptions.plugins.title,
                  text: "Jumlah Submissions",
                },
              },
              scales: {
                ...barOptions.scales,
                y: {
                  ...barOptions.scales.y,
                  title: {
                    ...barOptions.scales.y.title,
                    text: "Jumlah",
                  },
                },
              },
            }}
          />
        </div>

        {/* Assignment Types Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <Pie
            data={chartData.assignmentTypes}
            options={{
              ...pieOptions,
              plugins: {
                ...pieOptions.plugins,
                title: {
                  ...pieOptions.plugins.title,
                  text: "Distribusi Jenis Assignment",
                },
              },
            }}
          />
        </div>

        {/* Submission Status Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <Doughnut
            data={chartData.submissionStatus}
            options={{
              ...pieOptions,
              plugins: {
                ...pieOptions.plugins,
                title: {
                  ...pieOptions.plugins.title,
                  text: "Status Submissions",
                },
              },
            }}
          />
        </div>

        {/* Score Trend Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 lg:col-span-2">
          <Line
            data={chartData.scoreTrend}
            options={{
              ...lineOptions,
              plugins: {
                ...lineOptions.plugins,
                title: {
                  ...lineOptions.plugins.title,
                  text: "Tren Nilai dari Waktu ke Waktu",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(AssignmentChartsPage);