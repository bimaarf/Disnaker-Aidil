import { NotebookPen, Save, X } from "lucide-react";
import React, { memo, useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAssignmentSubmission } from "../../../../../../../../features/classroom/assignmentHook";
import { updateSubmissionInGroup } from "../../../../../../../../features/classroom/assignmentAnswerSlice";
import { useDispatch } from "react-redux";

const GradingForAnswerForm = memo(
  ({
    setIsResultEdit,
    submission,
    isUpdating,
    assignmentId,
    classroomCode,
    setSubmissionData,
  }) => {
    const { updateSubmission } = useAssignmentSubmission(
      classroomCode,
      assignmentId,
      {
        autoLoad: true,
        enablePolling: false,
        // onSubmissionUpdate: (updatedSubmission) => {
        //   if (selectedSubmission?.id === updatedSubmission.id) {
        //     setSelectedSubmission(updatedSubmission);
        //   }
        // },
        onError: (err) => {
          console.error("Submission error:", err);
        },
      }
    );
    const dispatch = useDispatch();
    const [formState, setFormState] = useState({
      points: "",
      maxPoints: 100,
      feedback: "",
      status: "graded",
      isDirty: false,
    });

    // Initialize form state
    useEffect(() => {
      if (submission) {
        setFormState({
          points: submission.points || "",
          maxPoints: submission.max_points || 100,
          feedback: submission.teacher_feedback || "",
          status: submission.status || "graded",
          isDirty: false,
        });
      }
    }, [submission]);

    // Track dirty state
    // useEffect(() => {
    //   if (!submission) return;
    //   const hasChanges =
    //     formState.points !== (submission.points || "") ||
    //     formState.maxPoints !== (submission.max_points || 100) ||
    //     formState.feedback !== (submission.teacher_feedback || "") ||
    //     formState.status !== (submission.status || "graded");

    //   if (hasChanges !== formState.isDirty) {
    //     setFormState((prev) => ({ ...prev, isDirty: hasChanges }));
    //   }
    // }, [
    //   formState.points,
    //   formState.maxPoints,
    //   formState.feedback,
    //   formState.status,
    //   submission,
    // ]);

    const handleFieldChange = useCallback((field, value) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    }, []);
    const onUpdateSubmission = useCallback(
      async (updateData) => {
        try {
          const result = await updateSubmission(updateData);
          // if (result?.success) {
          //   setFormState((prev) => ({ ...prev, isDirty: false }));
          //   toast.success("Penilaian berhasil disimpan");
          //   setSelectedRespondent((prev) => ({
          //     ...prev,
          //     submission: result.data, // update submission pakai response API
          //     updated_at: new Date().toISOString(),
          //   }));
          //   dispatch(
          //     updateSubmissionInGroup({
          //       assignmentId,
          //       submission: result.data,
          //     })
          //   );

          //   // Update parent state -> trigger re-render
          //   setSubmissionData(result.data);
          // }

          // if (result?.data) {
          // update redux (submissions di grouped_answers)
          // dispatch(
          //   updateSubmissionInGroup({
          //     assignmentId,
          //     submission: result.data,
          //   })
          // );
          // // update local state
          // setSubmissionData(result.data);
          // }

          return result;
        } catch (error) {
          console.error("Update submission error:", error);
          return { success: false, error: error.message };
        }
      },
      [assignmentId, updateSubmission, dispatch]
    );

    const handleSubmit = async (e) => {
      e.preventDefault();

      const updateData = {
        submission_id: submission?.id,
        status: formState.status,
        points: formState.points ? parseFloat(formState.points) : null,
        max_points: formState.maxPoints
          ? parseFloat(formState.maxPoints)
          : null,
        teacher_feedback: formState.feedback.trim() || null,
      };

      try {
        const result = await onUpdateSubmission(updateData);
        if (result?.success) {
          const updatedSubmission = result.data?.data || result.data;

          toast.success("Penilaian berhasil disimpan");

          // update Redux
          dispatch(
            updateSubmissionInGroup({
              assignmentId,
              submission: updatedSubmission,
            })
          );

          // update local state untuk Preview
          setSubmissionData(updatedSubmission);
          setIsResultEdit(false);
        }
      } catch (error) {
        console.error("Grading error:", error);
        toast.error("Gagal menyimpan penilaian");
      }
    };

    const handleReset = useCallback(() => {
      if (submission) {
        setFormState({
          points: submission.points || "",
          maxPoints: submission.max_points || 100,
          feedback: submission.teacher_feedback || "",
          status: submission.status || "graded",
          isDirty: false,
        });
      }
    }, [submission]);

    if (!submission) return null;

    return (
      <div className="">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-md bg-primary/10 text-primary">
            <NotebookPen className="w-4 h-4" />
          </div>
          <h3 className="text-base font-semibold text-base-content">
            Penilaian dan Feedback
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-base-content mb-2">
              Status Penilaian <span className="text-error">*</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleFieldChange("status", "submitted")}
                className={`px-4 py-2 rounded-xl font-medium text-sm ${
                  formState.status === "submitted"
                    ? "bg-info text-white shadow-md"
                    : "bg-base-200 dark:bg-base-300 text-base-content/70 hover:bg-base-300"
                }`}>
                Dikumpulkan
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleFieldChange("status", "graded")}
                className={`px-4 py-2 rounded-xl font-medium text-sm ${
                  formState.status === "graded"
                    ? "bg-primary text-white shadow-md"
                    : "bg-base-200 dark:bg-base-300 text-base-content/70 hover:bg-base-300"
                }`}>
                Dinilai
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleFieldChange("status", "returned")}
                className={`px-4 py-2 rounded-xl font-medium text-sm ${
                  formState.status === "returned"
                    ? "bg-warning text-white shadow-md"
                    : "bg-base-200 dark:bg-base-300 hover:bg-base-300"
                }`}>
                Dikembalikan
              </button>
            </div>
          </div>

          {/* Points */}
          <div className="grid grid-cols-2 gap-2 items-end">
            <div>
              <input
                type="number"
                value={formState.points}
                onChange={(e) => handleFieldChange("points", e.target.value)}
                min="0"
                max={formState.maxPoints}
                step="0.01"
                disabled={isUpdating}
                className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300/80"
                placeholder="Masukkan nilai"
                required={formState.status === "graded"}
              />
            </div>
            <div>
              <p className="text-[10px] text-base-content/60 text-center">
                Max default : {submission.max_points}
              </p>
              <input
                type="number"
                value={formState.maxPoints}
                onChange={(e) => handleFieldChange("maxPoints", e.target.value)}
                min="0"
                step="1"
                disabled={isUpdating}
                className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300/80"
                placeholder="Nilai maksimal"
              />
            </div>
          </div>

          {/* Percentage */}
          {formState.points && formState.maxPoints && (
            <div className="p-3 bg-info/5 border border-info/10 rounded-lg flex items-center justify-between text-sm">
              <span className="font-medium text-info">Persentase:</span>
              <span className="font-semibold text-info">
                {Math.round(
                  (parseFloat(formState.points) /
                    parseFloat(formState.maxPoints)) *
                    100
                )}
                %
              </span>
            </div>
          )}

          {/* Feedback */}
          <textarea
            value={formState.feedback}
            onChange={(e) => handleFieldChange("feedback", e.target.value)}
            rows={3}
            disabled={isUpdating}
            className="w-full px-4 py-3 bg-base-200/30 dark:bg-base-300 border rounded-2xl outline-none focus:outline-none focus:border-primary transition-all duration-200 text-base-content/80 border-base-300/80"
            placeholder="Berikan feedback yang konstruktif..."
            maxLength={2000}
          />

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <ActionButton
              type="submit"
              icon={Save}
              label={
                formState.status === "graded"
                  ? "Simpan Penilaian"
                  : "Kembalikan untuk Revisi"
              }
              color={formState.status === "graded" ? "primary" : "warning"}
              disabled={isUpdating}
              loading={isUpdating}
              className="flex-1"
            />
            {formState.isDirty && (
              <ActionButton
                type="button"
                icon={X}
                label="Batal"
                color="ghost"
                disabled={isUpdating}
                onClick={handleReset}
              />
            )}
          </div>
        </form>
      </div>
    );
  }
);

GradingForAnswerForm.displayName = "GradingForAnswerForm";

const ActionButton = memo(
  ({
    onClick,
    icon: Icon,
    label,
    color = "primary",
    disabled = false,
    loading = false,
    size = "md",
    className = "",
  }) => {
    const baseClasses =
      "flex items-center justify-center gap-2 font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";
    const sizeClasses = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };
    const colorClasses = {
      primary: "bg-primary text-primary-content hover:bg-primary/90",
      warning: "bg-warning text-warning-content hover:bg-warning/90",
      error: "bg-error text-error-content hover:bg-error/90",
      success: "bg-success text-success-content hover:bg-success/90",
      info: "bg-info text-info-content hover:bg-info/90",
      secondary: "bg-secondary text-secondary-content hover:bg-secondary/90",
      ghost: "bg-base-200 text-base-content hover:bg-base-300",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`${baseClasses} ${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
        {loading ? <LoadingSpinner size="sm" /> : <Icon className="w-4 h-4" />}
        <span>{loading ? "Memuat..." : label}</span>
      </button>
    );
  }
);
ActionButton.displayName = "ActionButton";
const LoadingSpinner = memo(({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  return (
    <div className="relative inline-block">
      <div
        className={`border-2 border-primary/20 rounded-full animate-spin ${sizeClasses[size]} ${className}`}
        aria-label="Memuat"
      />
      <div
        className={`absolute inset-0 border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin ${sizeClasses[size]}`}
      />
    </div>
  );
});
LoadingSpinner.displayName = "LoadingSpinner";
export default GradingForAnswerForm;
