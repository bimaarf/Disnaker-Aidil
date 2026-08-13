import React, { memo } from "react";
import { NotebookPen, Clock } from "lucide-react";

const GradingForAnswerPreview = memo(({ submission, assignment }) => {
  if (!submission) return null;

  const formatDate = (date) => {
    // Placeholder for date formatting; implement as needed
    return new Date(date).toLocaleString();
  };

  const getSubmissionStatusConfig = (status) => {
    switch (status) {
      case "submitted":
        return { text: "Dikumpulkan", className: "bg-primary/10 text-primary" };
      case "graded":
        return { text: "Dinilai", className: "bg-success/10 text-success" };
      case "returned":
        return {
          text: "Dikembalikan",
          className: "bg-error/10 text-error",
        };
      default:
        return { text: status, className: "bg-base-200 text-base-content" };
    }
  };

  const SubmissionStatusBadge = ({ status, isLate }) => {
    const { text, className } = getSubmissionStatusConfig(status);
    let badgeClass = "px-2 py-1 rounded-full text-xs font-medium " + className;
    if (isLate) badgeClass += " border border-error/20";

    return (
      <div className={badgeClass}>
        {text}
        {isLate ? " (Terlambat)" : ""}
      </div>
    );
  };

  return (
    <div className="">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-base-content">
              {submission.student?.name}
            </h2>
            <p className="text-sm text-base-content/60">
              {submission.student?.email}
            </p>
          </div>
          <SubmissionStatusBadge
            status={submission.status}
            isLate={submission.is_late}
          />
        </div>

        {submission.submission_text && (
          <div className="pt-4 border-t border-base-300/80">
            <h4 className="text-sm font-medium text-base-content mb-2">
              Jawaban:
            </h4>
            <div className="p-4 bg-info/10 dark:bg-info/10 border border-info/20 rounded-2xl">
              <div className="flex items-start gap-2 text-base-content/80">
                <NotebookPen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="font-normal whitespace-pre-line text-sm">
                  {submission.submission_text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Assignment Deadline Info */}
        {assignment?.available_until && (
          <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <div className="flex items-center gap-2 text-warning text-sm">
              <Clock className="w-4 h-4" />
              <span className="font-medium">
                Batas Waktu: {formatDate(assignment.available_until)}
              </span>
            </div>
            {new Date() > new Date(assignment.available_until) && (
              <p className="text-xs text-warning/70 mt-1">
                Batas waktu telah lewat. Pengumpulan akan ditandai terlambat.
              </p>
            )}
          </div>
        )}

        {/* Submission Info */}
        <div className="p-4 bg-base-100/50 rounded-lg border border-base-300/80 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-base-content/60 min-w-[80px]">Status:</span>
              <span className="font-medium">
                {getSubmissionStatusConfig(submission.status).text}
              </span>
            </div>
            {submission.submitted_at && (
              <div className="flex items-center gap-2">
                <span className="text-base-content/60 min-w-[80px]">
                  Dikumpul:
                </span>
                <span className="font-medium">
                  {formatDate(submission.submitted_at)}
                </span>
              </div>
            )}
            {submission.points !== null && submission.points !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-base-content/60 min-w-[80px]">
                  Nilai:
                </span>
                <span className="font-medium">
                  {submission.points}
                  {submission.max_points ? `/${submission.max_points}` : ""}
                </span>
              </div>
            )}
            {submission.graded_at && (
              <div className="flex items-center gap-2">
                <span className="text-base-content/60 min-w-[80px]">
                  Dinilai:
                </span>
                <span className="font-medium">
                  {formatDate(submission.graded_at)}
                </span>
              </div>
            )}
          </div>

          {/* Feedback */}
          {submission.teacher_feedback && (
            <div className="pt-4 border-t border-base-300/80">
              <h4 className="text-sm font-medium text-base-content mb-2">
                Catatan Tutor:
              </h4>
              <div className="p-4 bg-warning/10 dark:bg-warning/10 border border-warning/20 rounded-2xl">
                <div className="flex items-start gap-2 text-base-content/80">
                  <NotebookPen className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-normal whitespace-pre-line">
                    {submission.teacher_feedback}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Files */}
          {submission.files?.length > 0 && (
            <div className="pt-4 border-t border-base-300/80">
              <h4 className="text-sm font-medium text-base-content mb-2">
                File yang Dikumpul:
              </h4>
              <div className="space-y-2">
                {submission.files
                  .filter((f) => f.is_active)
                  .map((file) => (
                    <div key={file.id} className="p-2 bg-base-200 rounded-lg">
                      {file.file_name || "File"}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

GradingForAnswerPreview.displayName = "GradingForAnswerPreview";

export default GradingForAnswerPreview;
