import { useSelector } from "react-redux";

import { AnimatePresence, motion } from "framer-motion";
import React, {
  useCallback,
  useEffect,
  useMemo,
  memo,
  useState,
  useRef,
} from "react";
import { toast } from "react-toastify";
import { useAssignmentQuestions } from "../../../../../../../../features/classroom/assignmentQuestionHook";
import { useAssignmentAnswers } from "../../../../../../../../features/classroom/assignmentAnswerHook";
import {
  normalizeAnswerValue,
  normalizeServerAnswers,
} from "../../../../../../../../features/classroom/assignmentAnswerSlice";
import {
  ChevronLeft,
  Check,
  Loader,
  Users,
  Calendar,
  Clock,
  ChevronRight,
  MessageSquare,
  Send,
  X,
  NotebookPen,
  Award,
  Edit,
} from "lucide-react";
import useIsMobile from "../../../../../../../../Context/__useIsMobile";
import { selectUser } from "../../../../../../../../features/authentication/AuthSlice";
import GradingForAnswerForm from "./GradingForAnswerForm";
import GradingForAnswerPreview from "./GradingForAnswerPreview";

// const API_BASE_URL = process.env.REACT_APP_API;

const AnswerLoadingPlaceholder = ({ questionCount }) => (
  <div className="flex items-start w-full justify-center min-h-[100vh]">
    <div className="w-full p-4 space-y-2">
      <div className="h-6 bg-base-300 rounded w-1/3 mx-auto" />
      <div className="flex justify-between items-center">
        <div className="h-4 bg-base-300 rounded w-1/2" />
        <div className="h-4 bg-base-300 rounded w-12" />
      </div>
      {Array.from({ length: questionCount }).map((_, idx) => (
        <div
          key={idx}
          className="w-full mx-auto p-5 bg-base-200 dark:bg-base-200 rounded-xl shadow-lg mb-6 transition-all duration-300 hover:shadow-sm relative"
          style={{ minHeight: "200px" }}>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-base-300 rounded w-6" />
            <div className="h-4 bg-base-300 rounded w-24" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-base-300 rounded w-1/4" />
            <div className="h-20 bg-base-300 rounded w-full" />
          </div>
          <div className="flex flex-col md:flex-row gap-2">
            <div className="h-10 bg-base-300 rounded w-full md:w-1/2" />
            <div className="space-y-2 w-full md:w-1/2">
              <div className="h-4 bg-base-300 rounded w-3/4" />
              <div className="h-4 bg-base-300 rounded w-1/2" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <div className="h-10 bg-base-300 rounded w-24" />
            <div className="h-10 bg-base-300 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const AnswerPreviewCard = ({
  question,
  answer,
  index,
  canViewAll,
  onGrade,
}) => {
  // Helper function to parse options from snapshot
  const parseOptions = (optionsSnapshot) => {
    if (!optionsSnapshot) return [];
    try {
      if (typeof optionsSnapshot === "string") {
        return JSON.parse(optionsSnapshot);
      }
      return optionsSnapshot;
    } catch (e) {
      console.warn("Failed to parse options:", optionsSnapshot);
      return [];
    }
  };
  const currentUser = useSelector(selectUser);
  const [isEditing, setIsEditing] = useState(false);

  const [localIsCorrect, setLocalIsCorrect] = useState(answer.is_correct);
  const [localPoints, setLocalPoints] = useState(answer.awarded_points ?? 0);
  const [isGrading, setIsGrading] = useState(false);

  useEffect(() => {
    setLocalIsCorrect(answer.is_correct);
    setLocalPoints(answer.awarded_points ?? 0);
  }, [answer.is_correct, answer.awarded_points]);
  const handleCancel = () => {
    // Reset ke nilai awal
    setLocalIsCorrect(answer.is_correct);
    setLocalPoints(answer.awarded_points ?? 0);
    setIsEditing(false);
  };

  const handleSaveGrade = async () => {
    setIsGrading(true);
    try {
      await onGrade(
        answer.id,
        localIsCorrect === true ? 1 : localIsCorrect === false ? 0 : null, // <--- ini untuk "ungraded"
        localPoints
      );
    } catch (error) {
      toast.error("Failed to save grade");
    } finally {
      setIsGrading(false);
      setIsEditing(false);
    }
  };

  const options = parseOptions(
    question.question_options_snapshot || question.options
  );
  const isAutoGraded =
    ["radio", "checkbox"].includes(question.type) &&
    options.some((opt) => opt.is_correct);

  const renderAnswerPreview = () => {
    const questionType = question.question_type_snapshot || question.type;

    // Tentukan warna background berdasarkan status jawaban
    const bgClass =
      localIsCorrect === true
        ? "bg-success/10 dark:bg-success/10 border border-success/20"
        : localIsCorrect === false
        ? "bg-error/10 dark:bg-error/10 border border-error/20"
        : "bg-base-100 dark:bg-base-300 border border-base-300";

    switch (questionType) {
      case "text":
        return (
          <div className={`mt-2 p-3 rounded-lg ${bgClass}`}>
            <p className="text-sm whitespace-pre-wrap">
              {answer.answer_data || "No answer provided"}
            </p>
          </div>
        );

      case "radio": {
        let selectedValue = answer.answer_data;
        if (Array.isArray(selectedValue)) {
          selectedValue = selectedValue[0];
        } else if (
          typeof selectedValue === "object" &&
          selectedValue !== null
        ) {
          selectedValue =
            selectedValue.label ||
            selectedValue.value ||
            selectedValue.id ||
            "";
        }

        return (
          <div className={`mt-2 p-3 rounded-lg ${bgClass}`}>
            <div className="space-y-2">
              <p className="text-xs text-base-content/60 mb-2">
                Available options:
              </p>
              {options.map((opt, idx) => {
                const optValue = opt.id || opt.value || opt.label || "";
                const isChecked = selectedValue === optValue;

                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked
                          ? "border-primary bg-primary"
                          : "border-base-content/30"
                      }`}>
                      {isChecked && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isChecked
                          ? "font-medium text-primary"
                          : "text-base-content/70"
                      }`}>
                      {opt.label}
                    </span>
                    {isChecked && (
                      <span className="text-xs bg-secondary text-secondary-content px-2 py-1 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
              {!selectedValue && (
                <span className="text-sm text-base-content/70 italic">
                  No option selected
                </span>
              )}
            </div>
          </div>
        );
      }

      case "checkbox": {
        const selectedValues = Array.isArray(answer.answer_data)
          ? answer.answer_data.map((val) =>
              typeof val === "object" && val !== null
                ? val.label || val.value || val.id || ""
                : val
            )
          : [];

        return (
          <div className={`mt-2 p-3 rounded-lg ${bgClass}`}>
            <div className="space-y-2">
              <p className="text-xs text-base-content/60 mb-2">
                Available options:
              </p>
              {options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      selectedValues.includes(option.label) ||
                      selectedValues.includes(option.value) ||
                      selectedValues.includes(option.id)
                        ? "border-primary bg-primary"
                        : "border-base-content/30"
                    }`}>
                    {(selectedValues.includes(option.label) ||
                      selectedValues.includes(option.value) ||
                      selectedValues.includes(option.id)) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      selectedValues.includes(option.label) ||
                      selectedValues.includes(option.value) ||
                      selectedValues.includes(option.id)
                        ? "font-medium text-primary"
                        : "text-base-content/70"
                    }`}>
                    {option.label}
                  </span>
                  {(selectedValues.includes(option.label) ||
                    selectedValues.includes(option.value) ||
                    selectedValues.includes(option.id)) && (
                    <span className="text-xs bg-secondary text-secondary-content px-2 py-1 rounded-full">
                      Selected
                    </span>
                  )}
                </div>
              ))}
              {selectedValues.length === 0 && (
                <span className="text-sm text-base-content/70 italic">
                  No selections made
                </span>
              )}
            </div>
          </div>
        );
      }

      case "file":
      case "multiple_file": {
        return (
          <div className={`mt-2 p-3 rounded-lg ${bgClass}`}>
            {Array.isArray(answer.answer_data) &&
            answer.answer_data.length > 0 ? (
              answer.answer_data.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-sm">
                    attachment
                  </span>
                  <span className="text-sm">{file.split("/").pop()}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-base-content/70">
                No files uploaded
              </span>
            )}
          </div>
        );
      }

      default:
        return (
          <div className={`mt-2 p-3 rounded-lg ${bgClass}`}>
            <span className="text-sm text-base-content/70">
              Unknown answer type
            </span>
          </div>
        );
    }
  };

  const borderClass =
    localIsCorrect === true
      ? "border-success/20"
      : localIsCorrect === false
      ? "border-error/20"
      : "border-base-200";

  const bgClass =
    localIsCorrect === true
      ? "bg-success/5 dark:bg-success/5"
      : localIsCorrect === false
      ? "bg-error/5 dark:bg-error/5"
      : "bg-base-100 dark:bg-base-200";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative p-4 mb-2 border rounded-xl shadow-sm backdrop-blur-sm ${borderClass} ${bgClass}`}>
        <div
          className={`absolute top-2 right-2 px-3 py-1 rounded-full text-[12px] ${
            localIsCorrect === true
              ? "bg-success/5 text-success"
              : localIsCorrect === false
              ? "bg-error/5 text-error"
              : "bg-base-300/50 text-base-content/60"
          }`}>
          {localPoints}/{question.points || 0} Points
        </div>
        <div className="flex items-start gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm">
            {index + 1}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-base bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {question.question_snapshot || question.question}
            </h4>
            <span className="text-xs text-base-content/60 capitalize">
              {question.question_type_snapshot || question.type} question
            </span>
          </div>
        </div>

        {renderAnswerPreview()}
        {canViewAll && (
          <div className="mt-4 pt-4 border-t border-base-200">
            {isAutoGraded && answer.is_correct !== null && (
              <p className="text-info text-sm mb-2">
                Auto-graded: {answer.is_correct ? "Correct" : "Incorrect"} (
                {answer.awarded_points} / {question.points}) - You can override
              </p>
            )}
            {/* edit grade */}
          </div>
        )}
      </motion.div>
      <div className="mt-4 flex items-center gap-2">
        {/* Edit Button - Only show when not editing */}
        {!isEditing && currentUser.role !== "user" && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:brightness-90 transition-colors duration-100">
            Edit Grade
          </button>
        )}

        {/* Preview Mode */}
        {!isEditing ? (
          <div className="flex justify-between items-center px-4 py-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[12px] text-base-content/60`}>
                {localIsCorrect === true
                  ? "Correct"
                  : localIsCorrect === false
                  ? "Incorrect"
                  : "Ungraded"}
              </span>
            </div>
            <span className={`text-[12px] text-base-content/60`}>
              {localPoints} / {question.points || 0} Points
            </span>
          </div>
        ) : (
          currentUser.role !== "user" && (
            /* Edit Mode */
            <div className="space-y-2 p-4 bg-base-100 dark:bg-base-200 shadow-sm backdrop-blur-sm rounded-lg border border-base-200/50">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Grade Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "ungraded", label: "Ungraded", value: null },
                    { key: "correct", label: "Correct", value: true },
                    { key: "incorrect", label: "Incorrect", value: false },
                  ].map(({ key, label, value }) => {
                    const isActive = localIsCorrect === value;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setLocalIsCorrect(value);
                          // Auto-set points based on status
                          if (value === null) {
                            setLocalPoints(0);
                          } else if (value === true) {
                            setLocalPoints(question.points || 0);
                          } else {
                            setLocalPoints(0);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-all text-xs active:scale-95 duration-100 ${
                          isActive
                            ? key === "correct"
                              ? "bg-success text-white"
                              : key === "incorrect"
                              ? "bg-error text-white"
                              : "bg-yellow-400 text-base-content"
                            : "bg-base-200 outline-none text-base-content/70 border border-base-200/50 hover:bg-base-200/50"
                        }`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Points Input */}
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Points Awarded
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    pattern="\d*" // hanya menerima angka
                    inputMode="numeric" // keyboard mobile muncul angka
                    value={localPoints}
                    onChange={(e) => {
                      const val = e.target.value;
                      // cek hanya angka
                      if (/^\d*$/.test(val)) {
                        const numericValue = parseInt(val) || 0;
                        // batasi max sesuai question.points
                        setLocalPoints(
                          Math.min(numericValue, question.points || 0)
                        );
                      }
                    }}
                    className="w-20 px-3 py-2 text-center border bg-base-200 dark:bg-base-300 border-base-200/50 rounded-lg outline-none"
                  />

                  <span className="text-sm text-base-content/60">
                    of {question.points || 0} points
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveGrade}
                  disabled={isGrading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-100 ${
                    isGrading
                      ? "bg-base-200 text-white cursor-not-allowed"
                      : "bg-success text-white hover:brightness-90 shadow-md hover:shadow-lg"
                  }`}>
                  {isGrading ? (
                    <Loader className="animate-spin h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {isGrading ? "Saving..." : "Save Grade"}
                </button>

                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-base-content/70 bg-base-200 border border-base-200/50 rounded-lg hover:bg-base-200/50 transition-colors duration-100">
                  Cancel
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </>
  );
};

const RespondentsList = memo(
  ({ groupedAnswers, onSelectRespondent, selectedRespondent }) => {
    const [activeTab, setActiveTab] = useState("all");

    // Memoize filtered respondents and stats
    const { filteredRespondents, stats } = useMemo(() => {
      const respondentsArray = Object.values(groupedAnswers || {});

      const filtered = respondentsArray.filter((respondent) => {
        if (activeTab === "all") return true;
        if (activeTab === "today") {
          const today = new Date().toDateString();
          return new Date(respondent.submitted_at).toDateString() === today;
        }
        if (activeTab === "recent") {
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          return new Date(respondent.submitted_at) >= threeDaysAgo;
        }
        return true;
      });

      const today = new Date().toDateString();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const statsCalc = {
        all: respondentsArray.length,
        today: respondentsArray.filter(
          (r) => new Date(r.submitted_at).toDateString() === today
        ).length,
        recent: respondentsArray.filter(
          (r) => new Date(r.submitted_at) >= threeDaysAgo
        ).length,
      };

      return { filteredRespondents: filtered, stats: statsCalc };
    }, [groupedAnswers, activeTab]);

    return (
      <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-2 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-base-200/80">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-base-content">
              Respondents
            </h3>
            <span className="ml-auto px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
              {stats.all}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: "all", label: "Semua", icon: Users },
              { id: "today", label: "Hari Ini", icon: Calendar },
              { id: "recent", label: "3 Hari", icon: Clock },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2.5 py-1 active:-scale[99%] duration-200 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-content"
                    : "bg-base-200/50 text-base-content/70 hover:bg-base-200"
                }`}>
                <tab.icon className="w-3 h-3" />
                {tab.label}
                <span
                  className={`ml-1 px-1 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? "bg-primary-content/20 text-primary-content"
                      : "bg-base-content/10 text-base-content/70"
                  }`}>
                  {stats[tab.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Respondent List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-96">
          {filteredRespondents.length === 0 ? (
            <div className="text-center py-6 text-base-content/50">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Tidak ada responden</p>
            </div>
          ) : (
            filteredRespondents.map((respondent) => {
              const isActive =
                selectedRespondent?.user.id === respondent.user.id;
              const submittedDate = new Date(respondent.submitted_at);
              const isToday =
                submittedDate.toDateString() === new Date().toDateString();

              return (
                <button
                  key={respondent.user.id}
                  onClick={() => onSelectRespondent(respondent)}
                  className={`w-full text-left p-3 rounded-lg transition-all border ${
                    isActive
                      ? "bg-primary/5 border-primary/20"
                      : "bg-transparent border-base-200/80 hover:bg-base-200/50"
                  }`}>
                  <div className="flex items-start gap-2">
                    {/* Avatar/Number */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        isActive
                          ? "bg-primary text-primary-content"
                          : "bg-gradient-to-r from-secondary to-accent text-white"
                      }`}>
                      {Object.values(groupedAnswers).findIndex(
                        (r) => r.user.id === respondent.user.id
                      ) + 1}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-medium text-sm truncate ${
                            isActive ? "text-primary" : "text-base-content"
                          }`}>
                          {respondent.user.name || "Responden Tidak Dikenal"}
                        </p>
                        <div className="flex items-center gap-2 justify-end">
                          {isToday && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20">
                              <Clock className="w-2.5 h-2.5" />
                              Hari ini
                            </span>
                          )}
                          {isActive && (
                            <ChevronRight className="w-3 h-3 text-primary" />
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-base-content/50 truncate">
                        {respondent.user.email}
                      </p>

                      {/* Submission Info */}
                      <div className="flex items-baseline gap-1 mt-2 justify-between">
                        <div className="flex items-center gap-1.5">
                          {respondent.submission.status === "submitted" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                              <Send className="w-2.5 h-2.5" />
                              <span className="text-xs">Dikumpul</span>
                            </span>
                          )}
                          {respondent.submission.status === "graded" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20">
                              <Award className="w-2.5 h-2.5" />
                              <span className="text-xs">Dinilai</span>
                            </span>
                          )}
                          {respondent.submission.status === "draft" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning/10 text-warning border border-warning/20">
                              <NotebookPen className="w-2.5 h-2.5" />
                              <span className="text-xs">Draft</span>
                            </span>
                          )}
                          {respondent.submission.status === "returned" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-error/10 text-error border border-error/20">
                              <X className="w-2.5 h-2.5" />
                              <span className="text-xs">Dikembalikan</span>
                            </span>
                          )}

                          {/* Answer count if available */}
                          {respondent.answers && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-info/10 text-info border border-info/20">
                              <MessageSquare className="w-2.5 h-2.5" />
                              {respondent.answers.length}
                            </span>
                          )}
                        </div>

                        {/* Submission Time */}
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-base-content/40">
                          <Calendar className="w-3 h-3" />
                          {submittedDate.toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Stats */}
        <div className="p-4 border-t border-base-200/80 bg-base-100/50">
          <div className="grid grid-cols-2 gap-2 text-xs text-base-content/60">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
              Total: {stats.all}
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              Hari Ini: {stats.today}
            </div>
            <div className="flex items-center gap-1.5 col-span-2">
              <div className="w-1.5 h-1.5 rounded-full bg-warning"></div>3 Hari
              Terakhir: {stats.recent}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
RespondentsList.displayName = RespondentsList;
// Fixed normalizeOptionValue function
const normalizeOptionValue = (opt) => {
  if (!opt) return "";
  if (typeof opt === "string") return opt;
  return opt.value || opt.id || opt.label || "";
};

const QuestionItem = React.memo(
  ({ question, answer, onAnswerChange, isReadonly }) => {
    // State for text input (debounced for performance)
    const [localTextValue, setLocalTextValue] = useState("");
    const debounceTimeout = useRef(null);
    // State for file previews
    const [filePreviews, setFilePreviews] = useState([]);

    // Initialize text value
    useEffect(() => {
      if (question.type === "text") {
        setLocalTextValue(answer || "");
      }
    }, [answer, question.type]);

    // Initialize file previews
    useEffect(() => {
      if (question.type === "file" || question.type === "multiple_file") {
        const previews = Array.isArray(answer)
          ? answer.map((file) => ({
              name:
                file instanceof File
                  ? file.name
                  : typeof file === "string"
                  ? file.split("/").pop()
                  : "Unknown",
            }))
          : [];
        setFilePreviews(previews);
      }
    }, [answer, question.type]);

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }
      };
    }, []);

    // Debounced text input handler
    const handleTextChange = useCallback(
      (e) => {
        const value = e.target.value;
        setLocalTextValue(value);

        if (debounceTimeout.current) {
          clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
          if (!isReadonly && onAnswerChange) {
            onAnswerChange(question.id, value);
          }
        }, 300);
      },
      [onAnswerChange, question.id, isReadonly]
    );

    // Ensure final sync on blur
    const handleBlur = useCallback(() => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      if (!isReadonly && onAnswerChange) {
        onAnswerChange(question.id, localTextValue);
      }
    }, [onAnswerChange, question.id, isReadonly, localTextValue]);

    // Radio change handler
    const handleRadioChange = useCallback(
      (optValue) => {
        if (!isReadonly && onAnswerChange) {
          onAnswerChange(question.id, optValue);
        }
      },
      [onAnswerChange, question.id, isReadonly]
    );

    // Checkbox change handler
    const handleCheckboxChange = useCallback(
      (opt, checked) => {
        if (isReadonly) return;

        const optValue = normalizeOptionValue(opt);
        const currentValues = Array.isArray(answer) ? answer : [];
        const newAnswer = checked
          ? [...new Set([...currentValues, optValue])]
          : currentValues.filter((val) => val !== optValue);

        if (onAnswerChange) {
          onAnswerChange(question.id, newAnswer);
        }
      },
      [onAnswerChange, question.id, isReadonly, answer]
    );

    // File change handler
    const handleFileChange = useCallback(
      (e) => {
        if (isReadonly) return;
        const newFiles = Array.from(e.target.files);

        let updatedFiles;
        if (question.type === "file") {
          // hanya 1 file → ambil file pertama
          updatedFiles = newFiles.length > 0 ? [newFiles[0]] : [];
        } else {
          // multiple_file → gabungkan + buang duplikat
          const currentFiles = Array.isArray(answer) ? answer : [];
          updatedFiles = [...currentFiles, ...newFiles].filter(
            (file, index, self) =>
              index ===
              self.findIndex(
                (f) => f.name === file.name && f.size === file.size
              )
          );
        }

        if (onAnswerChange) {
          onAnswerChange(question.id, updatedFiles);
        }

        // Update previews
        const newPreviews = updatedFiles.map((file) => ({
          name:
            file instanceof File
              ? file.name
              : typeof file === "string"
              ? file.split("/").pop()
              : "Unknown",
        }));

        setFilePreviews(newPreviews);
      },
      [onAnswerChange, question.id, isReadonly, answer, question.type]
    );

    // Remove file handler
    const handleRemoveFile = useCallback(
      (index) => {
        if (isReadonly) return;
        const newFiles = Array.isArray(answer)
          ? answer.filter((_, i) => i !== index)
          : [];
        const newPreviews = filePreviews.filter((_, i) => i !== index);
        setFilePreviews(newPreviews);
        if (onAnswerChange) {
          onAnswerChange(question.id, newFiles);
        }
      },
      [answer, filePreviews, onAnswerChange, question.id, isReadonly]
    );

    // Parse question options
    const questionOptions = useMemo(() => {
      try {
        const optionsData =
          question.options || question.question_options_snapshot;
        if (!optionsData) return [];
        return typeof optionsData === "string"
          ? JSON.parse(optionsData)
          : optionsData;
      } catch (error) {
        console.warn("Failed to parse options:", error);
        return [];
      }
    }, [question.options, question.question_options_snapshot]);

    // Normalize answer for radio
    const normalizedAnswer = useMemo(() => {
      if (question.type === "radio") {
        if (Array.isArray(answer)) {
          return answer[0] || "";
        }
        if (typeof answer === "object" && answer !== null) {
          return answer.id || answer.value || answer.label || "";
        }
        return answer || "";
      }
      return answer;
    }, [answer, question.type]);

    // Normalize selected values for checkbox
    const selectedValues = useMemo(() => {
      if (!answer) return [];
      if (Array.isArray(answer)) {
        return answer.map((a) => normalizeOptionValue(a));
      }
      if (typeof answer === "string" && answer) {
        return [answer];
      }
      return [];
    }, [answer]);

    // Determine accepted file types
    const acceptFileTypes = useMemo(() => {
      const fileTypes =
        question.fileTypes ||
        question.question_file_types_snapshot ||
        (question.type === "file" || question.type === "multiple_file"
          ? [
              "application/pdf",
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/vnd.ms-powerpoint",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "text/plain",
              "image/jpeg",
              "image/jpg",
              "image/webp",
              "image/png",
              "image/gif",
            ]
          : []);
      return Array.isArray(fileTypes)
        ? fileTypes.join(",")
        : JSON.parse(fileTypes || "[]").join(",");
    }, [
      question.fileTypes,
      question.question_file_types_snapshot,
      question.type,
    ]);

    // Render based on question type
    const inputWrapperClass = `mt-2 rounded-xl ${
      isReadonly ? "opacity-60 cursor-not-allowed" : ""
    }`;

    if (question.type === "text") {
      return (
        <div className={inputWrapperClass}>
          <textarea
            value={localTextValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            disabled={isReadonly}
            className="w-full border-0 p-3 bg-base-200 dark:bg-base-300 rounded-xl outline-none resize-none h-24 text-sm placeholder:text-base-content/50"
            placeholder={
              isReadonly ? "Read only" : "Masukkan jawaban Anda di sini..."
            }
          />
        </div>
      );
    }

    if (question.type === "radio") {
      const anyChecked = questionOptions.some((opt) => {
        const optValue = normalizeOptionValue(opt);
        return normalizedAnswer === optValue;
      });

      return (
        <div className={inputWrapperClass}>
          <p className="text-xs text-base-content/60 mb-2 p-3 bg-base-200 dark:bg-base-300 rounded-xl">
            Available options:
          </p>
          <div className="space-y-2">
            {questionOptions.map((opt, idx) => {
              const optValue = normalizeOptionValue(opt);
              const checked = normalizedAnswer === optValue;
              const optId = `${question.id}_${idx}`;

              return (
                <div key={optId} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`question_${question.id}`}
                    value={optValue}
                    checked={checked}
                    disabled={isReadonly}
                    onChange={() => handleRadioChange(optValue)}
                    className="hidden"
                    id={optId}
                  />
                  <label
                    htmlFor={optId}
                    className={`flex items-center gap-2 flex-1 cursor-pointer ${
                      isReadonly ? "cursor-not-allowed" : ""
                    }`}>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        checked
                          ? "border-primary bg-primary"
                          : "border-base-content/30"
                      } ${isReadonly ? "opacity-50" : ""}`}>
                      {checked && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        checked
                          ? "font-medium text-primary"
                          : "text-base-content/70"
                      }`}>
                      {opt.label || opt.value || opt}
                    </span>
                  </label>
                </div>
              );
            })}
            {isReadonly && !anyChecked && (
              <span className="text-sm text-base-content/70 italic block">
                No option selected
              </span>
            )}
          </div>
        </div>
      );
    }

    if (question.type === "checkbox") {
      const anyChecked = selectedValues.length > 0;

      return (
        <div className={inputWrapperClass}>
          <p className="text-xs text-base-content/60 mb-2 p-3 bg-base-200 dark:bg-base-300 rounded-xl">
            Available options:
          </p>
          <div className="space-y-2">
            {questionOptions.map((opt, idx) => {
              const optValue = normalizeOptionValue(opt);
              const checked = selectedValues.includes(optValue);
              const optId = `${question.id}_checkbox_${idx}`;

              return (
                <div key={optId} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={isReadonly}
                    onChange={(e) =>
                      handleCheckboxChange(opt, e.target.checked)
                    }
                    className="hidden"
                    id={optId}
                  />
                  <label
                    htmlFor={optId}
                    className={`flex items-center gap-2 flex-1 cursor-pointer ${
                      isReadonly ? "cursor-not-allowed" : ""
                    }`}>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                        checked
                          ? "border-primary bg-primary"
                          : "border-base-content/30"
                      } ${isReadonly ? "opacity-50" : ""}`}>
                      {checked && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        checked
                          ? "font-medium text-primary"
                          : "text-base-content/70"
                      }`}>
                      {opt.label || opt.value || opt}
                    </span>
                  </label>
                </div>
              );
            })}
            {isReadonly && !anyChecked && (
              <span className="text-sm text-base-content/70 italic block">
                No selections made
              </span>
            )}
          </div>
        </div>
      );
    }

    if (question.type === "file" || question.type === "multiple_file") {
      return (
        <div
          className={`${inputWrapperClass} p-3 bg-base-200 dark:bg-base-300 rounded-xl`}>
          <input
            type="file"
            multiple={question.type === "multiple_file"}
            disabled={isReadonly}
            onChange={handleFileChange}
            accept={acceptFileTypes}
            className={`file-input file-input-bordered w-full mb-3 ${
              isReadonly ? "opacity-60 cursor-not-allowed" : ""
            }`}
          />
          {filePreviews.length > 0 && (
            <div className="space-y-1">
              {filePreviews.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-base-content/70">
                    attachment
                  </span>
                  <span className="text-sm text-base-content/80 flex-1 truncate">
                    {file.name}
                  </span>
                  {!isReadonly && (
                    <button
                      onClick={() => handleRemoveFile(idx)}
                      className="text-error btn btn-ghost btn-sm">
                      <span className="material-symbols-outlined text-sm">
                        delete
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {isReadonly && filePreviews.length === 0 && (
            <span className="text-sm text-base-content/70 block">
              No files uploaded
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={inputWrapperClass}>
        <span className="text-sm text-base-content/70">
          Tipe pertanyaan tidak didukung: {question.type}
        </span>
      </div>
    );
  }
);

QuestionItem.displayName = "QuestionItem";

const AssignmentAnswerResponder = ({
  assignmentId,
  classroomCode,
  assignment,
}) => {
  const { questions: serverQuestions, isLoading: questionsLoading } =
    useAssignmentQuestions(assignmentId, { autoLoad: true });
  const {
    answers: serverAnswers,
    isLoading: answersLoading,
    submitAnswers,
    loadAnswers,
    canViewAll,
    hasSubmitted,
    isReadonly,
    groupedAnswers,
    gradeAnswer,
  } = useAssignmentAnswers(assignmentId, { autoLoad: true });
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(true);
  // State untuk local answers dengan key yang lebih stabil
  const [localAnswers, setLocalAnswers] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const [readonlyCurrentPage, setReadonlyCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRespondent, setSelectedRespondent] = useState(null);
  const [isResultEdit, setIsResultEdit] = useState(false);
  // Initialize local answers dengan object key-value untuk performa yang lebih baik
  useEffect(() => {
    if (serverAnswers.length > 0 && !canViewAll) {
      const answersMap = {};
      normalizeServerAnswers(serverAnswers).forEach((answer) => {
        answersMap[answer.question_id] = answer.answer_data;
      });
      setLocalAnswers(answersMap);
    } else if (serverQuestions.length > 0 && !hasSubmitted && !canViewAll) {
      setLocalAnswers((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const emptyAnswersMap = {};
        serverQuestions.forEach((question) => {
          emptyAnswersMap[question.id] = normalizeAnswerValue(
            question.type,
            null
          );
        });
        return emptyAnswersMap;
      });
    }
  }, [serverAnswers, serverQuestions, canViewAll, hasSubmitted]);

  // Auto-select first respondent untuk admin
  useEffect(() => {
    if (
      canViewAll &&
      groupedAnswers &&
      Object.keys(groupedAnswers).length > 0 &&
      !selectedRespondent
    ) {
      setSelectedRespondent(Object.values(groupedAnswers)[0]);
      setAdminCurrentPage(1);
    }
  }, [canViewAll, groupedAnswers, selectedRespondent]);
  // di dalam AssignmentAnswerResponder
  const [submissionData, setSubmissionData] = useState(null);

  // misalnya submissionData kamu bentuk dari selectedRespondent
  useEffect(() => {
    if (selectedRespondent?.submission) {
      const sub = selectedRespondent.submission;

      setSubmissionData({
        id: sub.id,
        answers: selectedRespondent.answers,
        points:
          sub.points ??
          selectedRespondent.answers.reduce(
            (sum, a) => sum + (a.awarded_points || 0),
            0
          ),
        max_points:
          sub.max_points ??
          selectedRespondent.answers.reduce(
            (sum, a) => sum + (a.question?.points || 0),
            0
          ),
        teacher_feedback: selectedRespondent.submission.teacher_feedback || "",
        status: selectedRespondent.submission.status || "",
        student: sub.student, // kalau mau dipakai di preview
      });
      // setSubmissionData({
      //   id: selectedRespondent.submission.id,
      //   answers: selectedRespondent.answers,
      //   points: selectedRespondent.answers.reduce(
      //     (sum, a) => sum + (a.awarded_points || 0),
      //     0
      //   ),
      //   max_points: selectedRespondent.answers.reduce(
      //     (sum, a) => sum + (a.question?.points || 0),
      //     0
      //   ),
      //   teacher_feedback: selectedRespondent.submission.teacher_feedback || "",
      //   status: selectedRespondent.submission.status || "",
      // });
    }
  }, [selectedRespondent]);

  const questionsOnCurrentPage = useMemo(() => {
    return serverQuestions
      .filter((q) => q.page === currentPage)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [serverQuestions, currentPage]);

  const highestPage = useMemo(() => {
    return serverQuestions.length > 0
      ? Math.max(...serverQuestions.map((q) => q.page), 1)
      : 1;
  }, [serverQuestions]);

  // Improved handleAnswerChange yang lebih stabil dan cepat
  const handleAnswerChange = useCallback(
    (questionId, value) => {
      if (isReadonly) return;

      const question = serverQuestions.find((q) => q.id === questionId);
      const normalizedValue = normalizeAnswerValue(question?.type, value);

      setLocalAnswers((prev) => ({
        ...prev,
        [questionId]: normalizedValue,
      }));
    },
    [isReadonly, serverQuestions]
  );

  // Improved getAnswerForQuestion dengan performa yang lebih baik
  const getAnswerForQuestion = useCallback(
    (questionId) => {
      if (canViewAll && selectedRespondent) {
        const answer = selectedRespondent.answers.find(
          (a) => a.question_id === questionId
        );

        // Tambahkan normalisasi di sini juga untuk admin view
        if (
          answer &&
          answer.question_type_snapshot === "radio" &&
          Array.isArray(answer.answer_data)
        ) {
          return answer.answer_data[0] || "";
        }

        return answer ? answer.answer_data : "";
      }

      return localAnswers[questionId] || "";
    },
    [localAnswers, canViewAll, selectedRespondent]
  );

  const validateAnswers = useCallback(() => {
    let valid = true;
    let missingQuestions = [];

    serverQuestions.forEach((q) => {
      const answer = getAnswerForQuestion(q.id);
      if (q.is_required) {
        if (
          !answer ||
          (typeof answer === "string" && answer.trim() === "") ||
          (Array.isArray(answer) && answer.length === 0)
        ) {
          valid = false;
          missingQuestions.push(q.question);
        }
      }
    });

    if (!valid && missingQuestions.length > 0) {
      toast.error(
        `Please answer required questions: ${missingQuestions
          .slice(0, 3)
          .join(", ")}${missingQuestions.length > 3 ? "..." : ""}`
      );
    }

    return valid;
  }, [serverQuestions, getAnswerForQuestion]);

  const handleSubmit = useCallback(async () => {
    if (!validateAnswers()) return;

    if (hasSubmitted) {
      toast.error("You have already submitted your answers");
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert object back to array format for API
      const answersToSubmit = Object.entries(localAnswers)
        .filter(
          ([, value]) => value !== null && value !== undefined && value !== ""
        )
        .map(([questionId, answerData]) => ({
          question_id: parseInt(questionId),
          answer_data: normalizeAnswerValue(
            serverQuestions.find((q) => q.id === parseInt(questionId))?.type,
            answerData
          ),
        }));

      await submitAnswers(answersToSubmit);
      await loadAnswers(true);
      // toast.success("Answers submitted successfully!");
    } catch (error) {
      if (error.code === "ALREADY_SUBMITTED") {
        toast.error(
          "You have already submitted your answers. Each user can only submit once."
        );
      } else {
        toast.error(error.message || "Failed to submit answers");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    localAnswers,
    validateAnswers,
    submitAnswers,
    loadAnswers,
    hasSubmitted,
    serverQuestions,
  ]);

  const sortedServerAnswers = useMemo(() => {
    return [...serverAnswers].sort((a, b) => {
      const pageA = a.page || 1;
      const pageB = b.page || 1;
      if (pageA !== pageB) return pageA - pageB;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [serverAnswers]);

  const readonlyHighestPage = useMemo(() => {
    return serverAnswers.length > 0
      ? Math.max(...serverAnswers.map((a) => a.page || 1), 1)
      : 1;
  }, [serverAnswers]);

  const readonlyAnswersOnCurrentPage = useMemo(() => {
    return sortedServerAnswers.filter(
      (a) => (a.page || 1) === readonlyCurrentPage
    );
  }, [sortedServerAnswers, readonlyCurrentPage]);
  const pageLabels = useMemo(() => {
    if (!selectedRespondent || !selectedRespondent.answers) return {};
    const labels = {};
    selectedRespondent.answers.forEach((ans) => {
      if (ans.question_label_snapshot && !labels[ans.page]) {
        labels[ans.page] = ans.question_label_snapshot;
      }
    });
    return labels;
  }, [selectedRespondent]);
  const pageLabelsReadOnly = useMemo(() => {
    if (!serverAnswers || serverAnswers.length === 0) return {};
    const labels = {};
    serverAnswers.forEach((ans) => {
      if (ans.question_label_snapshot && !labels[ans.page]) {
        labels[ans.page] = ans.question_label_snapshot.trim();
      }
    });
    return labels;
  }, [serverAnswers]);

  // Admin view - show all respondents
  const adminHighestPage = useMemo(() => {
    if (!canViewAll) return 1;
    if (!selectedRespondent || !selectedRespondent.answers?.length) return 1;
    return Math.max(...selectedRespondent.answers.map((a) => a.page || 1), 1);
  }, [canViewAll, selectedRespondent]);

  const adminAnswersOnCurrentPage = useMemo(() => {
    if (!canViewAll) return [];
    if (!selectedRespondent || !selectedRespondent.answers?.length) return [];
    return selectedRespondent.answers
      .filter((a) => (a.page || 1) === adminCurrentPage)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [canViewAll, selectedRespondent, adminCurrentPage]);
  if (questionsLoading || answersLoading) {
    return <AnswerLoadingPlaceholder questionCount={3} />;
  }

  // Admin view
  if (canViewAll) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full grid grid-cols-1 lg:grid-cols-3 gap-2 overflow-hidden">
        {showSidebar && (
          <div className={isMobile ? "max-w-full" : "col-span-1"}>
            <RespondentsList
              groupedAnswers={groupedAnswers || {}}
              onSelectRespondent={setSelectedRespondent}
              selectedRespondent={selectedRespondent}
            />
          </div>
        )}

        <div
          className={
            isMobile
              ? "min-w-full px-1"
              : showSidebar
              ? "col-span-2 px-1"
              : "col-span-3 px-1 max-w-screen-md mx-auto w-full"
          }>
          {selectedRespondent ? (
            <>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-xl">
                <div className="flex flex-col md:flex-row gap-3 items-start justify-between">
                  <div className="flex items-start">
                    <div
                      onClick={() => setShowSidebar(!showSidebar)}
                      className="cursor-pointer flex items-start hover:brightness-95 active:scale-[98%] hover:scale-[99%] duration-100 transition-all">
                      <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-medium">
                        {Object.values(groupedAnswers).length}
                      </span>
                      <ChevronLeft
                        className={`w-5 h-5 text-primary transition-all duration-500 ${
                          showSidebar ? "rotate-0" : "rotate-180"
                        }`}
                      />
                    </div>
                    <div>
                      <h2 className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {selectedRespondent.user.name}
                        {`'s Answers`}
                      </h2>
                      <p className="text-xs text-base-content/70">
                        Submitted on:{" "}
                        {new Date(
                          selectedRespondent.submitted_at
                        ).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <div
                onClick={() => setIsResultEdit((prev) => !prev)}
                className="cursor-pointer flex w-fit px-4 py-1 rounded-xl bg-base-300/30 dark:bg-base-300 justify-end items-center gap-2 mb-4 active:scale-[98%] hover:scale-[99%] duration-100 transition-all">
                <div className="p-1.5 rounded-md bg-warning/5 text-warning">
                  {isResultEdit ? (
                    <NotebookPen className="w-4 h-4" />
                  ) : (
                    <Edit className="w-4 h-4" />
                  )}
                </div>
                <h3 className="font-semibold text-sm">Return results</h3>
              </div>
              <div className="bg-base-100 dark:bg-base-200 backdrop-blur-sm shadow-sm rounded-2xl border border-base-200/50 p-4 mb-4">
                {isResultEdit ? (
                  <GradingForAnswerForm
                    classroomCode={classroomCode}
                    assignmentId={assignmentId}
                    submission={submissionData}
                    setSubmissionData={setSubmissionData}
                    isUpdating={false}
                    setIsResultEdit={setIsResultEdit}
                  />
                ) : (
                  <GradingForAnswerPreview
                    classroomCode={classroomCode}
                    assignmentId={assignmentId}
                    submission={submissionData}
                    isUpdating={false}
                  />
                )}
              </div>
              {adminHighestPage > 1 && (
                <>
                  <motion.h2
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-md font-semibold gap-2 flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <NotebookPen className="w-4 h-4" />
                    </div>
                    <h3 className="text-base font-semibold text-base-content">
                      {pageLabels[adminCurrentPage] ||
                        `Page ${adminCurrentPage}`}
                    </h3>
                  </motion.h2>

                  <div className="flex items-center justify-between w-full mb-6 bg-base-100 dark:bg-base-200 rounded-2xl p-4 shadow-sm backdrop-blur-sm border border-base-200/50 dark:border-base-200/50 overflow-hidden">
                    <div className="w-full overflow-x-auto scrollbar-hidden overflow-y-hidden">
                      <ul className="steps w-max min-w-full flex-nowrap">
                        {Array.from({ length: adminHighestPage }, (_, idx) => (
                          <li
                            key={idx}
                            onClick={() => setAdminCurrentPage(idx + 1)}
                            className={`step cursor-pointer transition-all duration-300 step-indicator flex-shrink-0
                          ${
                            adminCurrentPage === idx + 1
                              ? "step-primary text-primary font-bold active"
                              : "hover:text-primary/70"
                          }`}>
                            <span className="hidden md:inline whitespace-nowrap px-2">
                              {pageLabels[idx + 1] || `Page ${idx + 1}`}
                            </span>
                            <span className="md:hidden flex-shrink-0">
                              {idx + 1}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {adminAnswersOnCurrentPage.map((answer, idx) => {
                    const baseQuestion = serverQuestions.find(
                      (q) => q.id === answer.question_id
                    );

                    const question = {
                      ...baseQuestion,
                      question_snapshot: answer.question_snapshot,
                      question_type_snapshot: answer.question_type_snapshot,
                      question_options_snapshot:
                        answer.question_options_snapshot,
                      question:
                        baseQuestion?.question || answer.question_snapshot,
                      type: baseQuestion?.type || answer.question_type_snapshot,
                    };

                    return (
                      <AnswerPreviewCard
                        key={answer.id}
                        question={question}
                        answer={answer}
                        index={idx}
                        canViewAll={canViewAll}
                        onGrade={gradeAnswer}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-base-content/30 mb-4">
                group
              </span>
              <h3 className="text-lg font-medium text-base-content/70">
                Select a respondent to view their answers
              </h3>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Student view - readonly jika sudah submit
  if (hasSubmitted || isReadonly) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-start w-full max-w-screen-md mx-auto justify-center">
        <div className="w-full p-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-success/10 to-info/10 rounded-xl text-center">
            <span className="material-symbols-outlined text-4xl text-success mb-2">
              check_circle
            </span>
            <h2 className="text-xl font-bold text-success">
              Assignment Submitted Successfully! {readonlyCurrentPage.length}
            </h2>
            <p className="text-sm text-base-content/70">
              You can review your answers below. No further changes can be made.
            </p>
          </motion.div>
          {readonlyHighestPage > 1 && (
            <>
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-md font-semibold gap-2 flex items-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <NotebookPen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-base-content">
                  {pageLabelsReadOnly[readonlyCurrentPage] ||
                    `Page ${readonlyCurrentPage}`}
                </h3>
              </motion.h2>

              <div className="flex items-center justify-between w-full mb-6 bg-base-100 dark:bg-base-200 rounded-2xl p-4 shadow-sm border border-base-200/50 dark:border-base-200/50 backdrop-blur-sm overflow-hidden">
                <div className="w-full overflow-x-auto scrollbar-hidden overflow-y-hidden">
                  <ul className="steps w-max min-w-full flex-nowrap">
                    {Array.from({ length: readonlyHighestPage }, (_, idx) => (
                      <li
                        key={idx}
                        onClick={() => setReadonlyCurrentPage(idx + 1)}
                        className={`step cursor-pointer transition-all duration-300 step-indicator flex-shrink-0
                ${
                  readonlyCurrentPage === idx + 1
                    ? "step-primary text-primary font-bold active"
                    : "hover:text-primary/70"
                }`}>
                        <span className="hidden md:inline whitespace-nowrap px-2">
                          {pageLabelsReadOnly[idx + 1] || `Page ${idx + 1}`}
                        </span>
                        <span className="md:hidden flex-shrink-0">
                          {idx + 1}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {assignment.submissions && assignment.submissions.length > 0 && (
            <div className="p-4 shadow-sm backdrop-blur-sm bg-base-100 dark:bg-base-200 border border-base-200/50 dark:border-base-200 rounded-2xl my-2">
              <h3 className="text-lg font-bold mb-4 text-center bg-gradient-to-r border-b border-base-300 pb-2 from-info to-info bg-clip-text text-transparent">
                {`The result's you submitted`}
              </h3>
              <GradingForAnswerPreview
                classroomCode={classroomCode}
                assignmentId={assignment.id}
                submission={assignment.submissions[0]} // ambil submission milik user
                isUpdating={false}
              />
            </div>
          )}

          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {readonlyAnswersOnCurrentPage.map((answer, idx) => {
                const baseQuestion = serverQuestions.find(
                  (q) => q.id === answer.question_id
                );

                const question = {
                  ...baseQuestion,
                  question_snapshot: answer.question_snapshot,
                  question_type_snapshot: answer.question_type_snapshot,
                  question_options_snapshot: answer.question_options_snapshot,
                  question: baseQuestion?.question || answer.question_snapshot,
                  type: baseQuestion?.type || answer.question_type_snapshot,
                };

                return (
                  <AnswerPreviewCard
                    key={answer.id}
                    question={question}
                    answer={answer}
                    index={idx}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  // Form view untuk student yang belum submit
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex items-start w-full overflow-hidden justify-start">
      <motion.div className="w-full p-0 md:p-4">
        <motion.h2
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-md font-semibold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
          {pageLabels[currentPage] || `Page ${currentPage}`}
        </motion.h2>

        <div className="flex items-center justify-between w-full mb-6 bg-base-100 dark:bg-base-200 rounded-2xl p-4 shadow-sm backdrop-blur-sm border border-base-200/50 dark:border-base-200/50 overflow-hidden">
          <div className="w-full overflow-x-auto scrollbar-hidden overflow-y-hidden">
            <ul className="steps w-max min-w-full flex-nowrap">
              {Array.from({ length: highestPage }, (_, idx) => (
                <li
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`step cursor-pointer transition-all duration-300 step-indicator flex-shrink-0
                    ${
                      currentPage === idx + 1
                        ? "step-primary text-primary font-bold active"
                        : "hover:text-primary/70"
                    }`}>
                  <span className="hidden md:inline whitespace-nowrap px-2">
                    {pageLabels[idx + 1] || `Page ${idx + 1}`}
                  </span>
                  <span className="md:hidden flex-shrink-0">{idx + 1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <motion.div className="space-y-2 md:mt-4">
          <AnimatePresence mode="wait">
            {questionsOnCurrentPage.map((question, idx) => (
              <motion.div
                key={`page_${currentPage}_question_${question.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.1 }}
                className="relative p-4 mb-2 border rounded-xl shadow-sm backdrop-blur-sm border-base-200/50 bg-base-100 dark:bg-base-200">
                <div className="flex items-start gap-2 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-base bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-relaxed">
                        {question.question}
                      </h4>
                      <p
                        className={`text-base-content/60 text-xs bg-base-300/30 px-2 py-0.5 rounded-md`}>
                        {question.points} Points
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-base-content/60 capitalize block">
                        {question.type} question{" "}
                      </p>
                      <p
                        className={`${
                          question.is_required
                            ? "text-error"
                            : "text-base-content/60"
                        } text-xs py-0.5 px-2`}>
                        {question.is_required ? "*Required" : "Optional"}
                      </p>
                    </div>
                  </div>
                </div>

                <QuestionItem
                  key={`${currentPage}_${question.id}_${question.type}`}
                  question={question}
                  answer={getAnswerForQuestion(question.id)}
                  onAnswerChange={handleAnswerChange}
                  isReadonly={isReadonly}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col md:flex-row justify-between shadow-sm backdrop-blur-sm items-start md:items-center gap-2 mt-8 pt-6 border-t-2 border-base-200/50 dark:border-base-200">
            {!isReadonly && !hasSubmitted && (
              <>
                <div className="alert alert-info flex-1 max-w-md">
                  <span className="material-symbols-outlined">info</span>
                  <span className="text-sm">
                    You can only submit your answers once. Please review all
                    pages before submitting.
                  </span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`btn btn-success btn-lg shadow-lg min-w-[200px] ${
                    isSubmitting ? "loading" : ""
                  }`}>
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span>
                      Submit All Answers
                    </>
                  )}
                </motion.button>
              </>
            )}

            {(isReadonly || hasSubmitted) && (
              <div className="alert alert-success w-full">
                <span className="material-symbols-outlined">check_circle</span>
                <span>Your answers have been submitted successfully!</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default AssignmentAnswerResponder;
