import React, { useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import { useDispatch, useSelector } from "react-redux";
import { fetchRespondentPerDayDetail } from "../../../../../../features/ppdb/periodSlice";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RespondentLineDetail = ({ selectedPeriodId }) => {
  const dispatch = useDispatch();

  const { respondentPerDayDetail, respondentPerDayDetailStatus } = useSelector(
    (state) => state.periods
  );

  useEffect(() => {
    console.log(
      "[RespondentLineDetail] respondentPerDayDetail[selectedPeriodId]:",
      selectedPeriodId,
      respondentPerDayDetail[selectedPeriodId]
    );
    if (!respondentPerDayDetail[selectedPeriodId]) {
      dispatch(fetchRespondentPerDayDetail(selectedPeriodId));
    }
  }, [dispatch, selectedPeriodId, respondentPerDayDetail]);

  const selected = respondentPerDayDetail[selectedPeriodId];

  const data = useMemo(() => {
    if (!selected) {
      console.log(
        "[RespondentLineDetail] No respondentPerDayDetail data for period:",
        selectedPeriodId
      );
      return null;
    }
    const labels = selected.submissions_by_date.map((s) =>
      new Date(s.date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
      })
    );
    const values = selected.submissions_by_date.map((s) => s.count);

    return {
      labels,
      datasets: [
        {
          label: selected.title,
          data: values,
          borderColor: "#3B82F6",
          backgroundColor: "#93C5FD55",
          tension: 0.3,
          pointRadius: 3,
        },
      ],
    };
  }, [selected]);

  if (respondentPerDayDetailStatus === "loading") {
    return <div className="text-sm text-gray-500">Memuat data harian...</div>;
  }

  if (!data) return null;

  const {
    total_submissions = 0,
    verified_only = 0,
    pass = 0,
    fail = 0,
    undecided = 0,
    unverified = total_submissions - verified_only,
  } = selected;

  return (
    <div className="max-w-full md:min-w-[50vh]">
      <h4 className="text-sm font-semibold mb-2">
        Rincian Pendaftar Harian: {selected.title}
      </h4>
      <div style={{ height: 300 }}>
        <Line
          key={JSON.stringify(selected)}
          data={data}
          options={{ responsive: true, maintainAspectRatio: false }}
        />
      </div>

      {/* Statistik tambahan */}
      <div className="mt-4 space-y-1 text-xs">
        <div>Total: {total_submissions}</div>
        <div>Terverifikasi: {verified_only}</div>
        <div>Belum Verifikasi: {unverified}</div>
        <div>Lulus: {pass}</div>
        <div>Tidak Lulus: {fail}</div>
        <div>Belum Ditentukan: {undecided}</div>
      </div>
    </div>
  );
};

export default RespondentLineDetail;
