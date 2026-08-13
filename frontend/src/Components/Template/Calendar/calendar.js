import React, { memo, useCallback, useMemo, useState } from "react";

const Calendar = memo(() => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = useMemo(() => {
    return new Date(year, month + 1, 0).getDate();
  }, [year, month]);

  const firstDayOfMonth = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  const prevMonthDays = useMemo(() => {
    return new Date(year, month, 0).getDate();
  }, [year, month]);

  const monthNames = useMemo(
    () => [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ],
    []
  );

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }, []);

  const handleDateClick = useCallback(
    (day) => {
      const newDate = new Date(year, month, day);
      setSelectedDate(newDate);
    },
    [year, month]
  );

  const formatDate = useCallback(
    (date) => {
      const days = [
        "Minggu",
        "Senin",
        "Selasa",
        "Rabu",
        "Kamis",
        "Jumat",
        "Sabtu",
      ];
      const dayName = days[date.getDay()];
      return `${dayName}, ${date.getDate()} ${
        monthNames[date.getMonth()]
      } ${date.getFullYear()}`;
    },
    [monthNames]
  );

  const isToday = useCallback(
    (day) => {
      const today = new Date();
      return (
        today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day
      );
    },
    [year, month]
  );

  const renderCalendarDays = useMemo(() => {
    const days = [];
    const startFrom = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Previous month days
    for (let i = startFrom; i > 0; i--) {
      days.push({
        day: prevMonthDays - i + 1,
        isCurrentMonth: false,
        isOtherMonth: true,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        day,
        isCurrentMonth: true,
        isOtherMonth: false,
      });
    }

    // Next month days
    const totalDaysShown = days.length;
    const remainingDays = 42 - totalDaysShown;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isOtherMonth: true,
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, prevMonthDays]);

  const dayNames = useMemo(
    () => ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    []
  );

  return (
    <div className="bg-base-100 dark:bg-base-200 border border-base-200/50 rounded-3xl p-6 shadow-md transition-all duration-300 h-fit backdrop-blur-sm">
      {/* Header with improved spacing and typography */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-1 mb-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <h3 className="text-xl font-bold text-base-content tracking-wide">
            Kalender
          </h3>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        </div>

        {/* Month navigation with better buttons */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="group p-3 text-base-content/60 hover:text-base-content hover:bg-base-200/80 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
            title="Bulan Sebelumnya">
            <svg
              className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <div className="px-6 py-2 bg-base-200/50 rounded-full">
            <span className="text-lg font-bold text-base-content tracking-wide">
              {monthNames[month]} {year}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="group p-3 text-base-content/60 hover:text-base-content hover:bg-base-200/80 rounded-full transition-all duration-300 hover:scale-110 active:scale-95"
            title="Bulan Berikutnya">
            <svg
              className="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar grid with improved spacing */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers with better styling */}
        {dayNames.map((day) => (
          <div
            key={day}
            className="text-xs font-bold text-base-content/70 py-3 text-center uppercase tracking-wider bg-base-200/30 rounded-lg">
            {day}
          </div>
        ))}

        {/* Calendar days with enhanced interactions */}
        {renderCalendarDays.map((item, index) => {
          const isSelected =
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === item.day &&
            item.isCurrentMonth;

          const todayCheck = item.isCurrentMonth && isToday(item.day);

          return (
            <button
              key={index}
              onClick={() => item.isCurrentMonth && handleDateClick(item.day)}
              disabled={!item.isCurrentMonth}
              className={`
                relative p-3 text-sm font-medium rounded-xl transition-all duration-300 
                h-12 w-full flex items-center justify-center group
                transform hover:scale-105 active:scale-95
                ${
                  isSelected
                    ? "bg-primary text-white shadow-md shadow-primary/30 scale-105"
                    : todayCheck
                    ? "bg-base-200/80 text-base-content ring-2 ring-primary/50 font-bold"
                    : item.isCurrentMonth
                    ? "text-base-content hover:bg-base-200/70 hover:shadow-md cursor-pointer"
                    : "text-base-content/30 cursor-not-allowed"
                }
              `}>
              <span
                className={`${
                  isSelected ? "scale-110" : ""
                } transition-transform duration-200`}>
                {item.day}
              </span>

              {/* Today indicator */}
              {todayCheck && !isSelected && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"></div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse"></div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected date display with improved styling */}
      <div className="mt-6 text-center">
        <div className="bg-base-200/50 rounded-2xl p-4 border border-base-200/30">
          <p className="text-xs font-medium text-base-content/60 mb-1 uppercase tracking-wider">
            Tanggal Terpilih
          </p>
          <p className="text-base font-bold text-base-content">
            {formatDate(selectedDate)}
          </p>
        </div>
      </div>
    </div>
  );
});

Calendar.displayName = "Calendar";
export default Calendar;
