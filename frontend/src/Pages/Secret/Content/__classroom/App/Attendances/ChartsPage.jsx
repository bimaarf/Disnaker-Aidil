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

const ChartsPage = ({ meetings }) => {
  // Process data for charts
  const chartData = useMemo(() => {
    if (!meetings || meetings.length === 0) {
      return {
        attendancePercentage: { labels: [], datasets: [] },
        attendanceCount: { labels: [], datasets: [] },
        meetingTypes: { labels: [], datasets: [] },
        meetingStatus: { labels: [], datasets: [] },
        attendanceTrend: { labels: [], datasets: [] },
      };
    }

    // Sort meetings by date for trend chart
    const sortedMeetings = [...meetings].sort(
      (a, b) => new Date(a.meeting_date) - new Date(b.meeting_date)
    );

    // 1. Attendance Percentage Chart
    const attendancePercentageData = {
      labels: meetings.map((meeting) => meeting.title),
      datasets: [
        {
          label: "Persentase Kehadiran (%)",
          data: meetings.map((meeting) => meeting.attendance_percentage),
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
      ],
    };

    // 2. Attendance Count Chart
    const attendanceCountData = {
      labels: meetings.map((meeting) => meeting.title),
      datasets: [
        {
          label: "Hadir",
          data: meetings.map((meeting) => meeting.present_count),
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
        {
          label: "Tidak Hadir",
          data: meetings.map((meeting) => meeting.absent_count),
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };

    // 3. Meeting Types Chart
    const typeCounts = meetings.reduce((acc, meeting) => {
      acc[meeting.type] = (acc[meeting.type] || 0) + 1;
      return acc;
    }, {});

    const typeLabels = {
      regular: "Reguler",
      exam: "Ujian",
      quiz: "Kuis",
      presentation: "Presentasi",
      field_trip: "Kunjungan",
    };

    const meetingTypesData = {
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

    // 4. Meeting Status Chart
    const statusCounts = meetings.reduce((acc, meeting) => {
      acc[meeting.status] = (acc[meeting.status] || 0) + 1;
      return acc;
    }, {});

    const statusLabels = {
      scheduled: "Terjadwal",
      ongoing: "Berlangsung",
      completed: "Selesai",
      cancelled: "Dibatalkan",
    };

    const meetingStatusData = {
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

    // 5. Attendance Trend Chart
    const attendanceTrendData = {
      labels: sortedMeetings.map((meeting) =>
        new Date(meeting.meeting_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
        })
      ),
      datasets: [
        {
          label: "Persentase Kehadiran",
          data: sortedMeetings.map((meeting) => meeting.attendance_percentage),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0.3,
          fill: true,
        },
      ],
    };

    return {
      attendancePercentage: attendancePercentageData,
      attendanceCount: attendanceCountData,
      meetingTypes: meetingTypesData,
      meetingStatus: meetingStatusData,
      attendanceTrend: attendanceTrendData,
    };
  }, [meetings]);

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
    if (!meetings || meetings.length === 0) {
      return {
        totalMeetings: 0,
        avgAttendance: 0,
        totalStudents: 0,
        ongoingMeetings: 0,
      };
    }

    const totalMeetings = meetings.length;
    const avgAttendance =
      meetings.reduce(
        (sum, meeting) => sum + meeting.attendance_percentage,
        0
      ) / totalMeetings;
    const totalStudents = Math.max(
      ...meetings.map((meeting) => meeting.attendance_count)
    );
    const ongoingMeetings = meetings.filter(
      (meeting) => meeting.status === "ongoing"
    ).length;

    return {
      totalMeetings,
      avgAttendance: Math.round(avgAttendance),
      totalStudents,
      ongoingMeetings,
    };
  }, [meetings]);

  if (!meetings || meetings.length === 0) {
    return (
      <div className="mx-auto p-6">
        <div className="text-center py-12">
          <CalendarDays className="w-16 h-16 mx-auto text-base-content/40 mb-4" />
          <h2 className="text-2xl font-bold text-base-content mb-2">
            Tidak Ada Data
          </h2>
          <p className="text-base-content/60">
            Belum ada data pertemuan untuk ditampilkan
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
              <p className="text-base-content text-sm">Total Pertemuan</p>
              <p className="text-2xl font-bold">{stats.totalMeetings}</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <TrendingUp className="w-10 h-10 text-green-500 mr-4" />
            <div>
              <p className="text-base-content text-sm">Rata-rata Kehadiran</p>
              <p className="text-2xl font-bold">{stats.avgAttendance}%</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <Users className="w-10 h-10 text-purple-500 mr-4" />
            <div>
              <p className="text-base-content text-sm">Total Siswa</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <Clock className="w-10 h-10 text-yellow-500 mr-4" />
            <div>
              <p className="text-base-content text-sm">Sedang Berlangsung</p>
              <p className="text-2xl font-bold">{stats.ongoingMeetings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Percentage Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <Bar
            data={chartData.attendancePercentage}
            options={{
              ...barOptions,
              plugins: {
                ...barOptions.plugins,
                title: {
                  ...barOptions.plugins.title,
                  text: "Persentase Kehadiran per Pertemuan",
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

        {/* Attendance Count Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <Bar
            data={chartData.attendanceCount}
            options={{
              ...barOptions,
              plugins: {
                ...barOptions.plugins,
                title: {
                  ...barOptions.plugins.title,
                  text: "Jumlah Kehadiran vs Ketidakhadiran",
                },
              },
              scales: {
                ...barOptions.scales,
                y: {
                  ...barOptions.scales.y,
                  title: {
                    ...barOptions.scales.y.title,
                    text: "Jumlah Siswa",
                  },
                },
              },
            }}
          />
        </div>

        {/* Meeting Types Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <Pie
            data={chartData.meetingTypes}
            options={{
              ...pieOptions,
              plugins: {
                ...pieOptions.plugins,
                title: {
                  ...pieOptions.plugins.title,
                  text: "Distribusi Jenis Pertemuan",
                },
              },
            }}
          />
        </div>

        {/* Meeting Status Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6">
          <Doughnut
            data={chartData.meetingStatus}
            options={{
              ...pieOptions,
              plugins: {
                ...pieOptions.plugins,
                title: {
                  ...pieOptions.plugins.title,
                  text: "Status Pertemuan",
                },
              },
            }}
          />
        </div>

        {/* Attendance Trend Chart */}
        <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm rounded-xl shadow-sm p-6 lg:col-span-2">
          <Line
            data={chartData.attendanceTrend}
            options={{
              ...lineOptions,
              plugins: {
                ...lineOptions.plugins,
                title: {
                  ...lineOptions.plugins.title,
                  text: "Tren Kehadiran dari Waktu ke Waktu",
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ChartsPage);
