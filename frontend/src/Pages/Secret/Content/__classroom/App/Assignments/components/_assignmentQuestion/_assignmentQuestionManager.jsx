import { AnimatePresence, motion } from "framer-motion";
import { debounce } from "lodash";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import "../../../../../../../../draggable.css";
import CreateQuestionByAssignment from "./_createQuestionByAssignment";
import useIsMobile from "../../../../../../../../Context/__useIsMobile";
import { useAssignmentQuestions } from "../../../../../../../../features/classroom/assignmentQuestionHook";
import { PlusCircleIcon } from "lucide-react";

const DraggableQuestion = ({ index, moveQuestion, children }) => {
  const ref = useRef(null);

  const [{ isDragging }, drag] = useDrag({
    type: "QUESTION",
    item: () => ({ index }), // Use function to get fresh index
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: () => true, // Add explicit canDrag
  });

  const [{ isOver, draggedItem }, drop] = useDrop({
    accept: "QUESTION",
    hover: (item, monitor) => {
      if (!ref.current) return;
      if (!monitor.isOver({ shallow: true })) return; // Add shallow check

      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();

      if (!clientOffset) return; // Guard against null clientOffset

      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Prevent unnecessary updates
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      // Add debouncing to prevent excessive calls
      if (moveQuestion && typeof moveQuestion === "function") {
        moveQuestion(dragIndex, hoverIndex);
        item.index = hoverIndex; // Update the item index
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      draggedItem: monitor.getItem(),
    }),
  });

  // Combine drag and drop refs safely
  const dragDropRef = useCallback(
    (node) => {
      ref.current = node;
      drag(drop(node));
    },
    [drag, drop]
  );

  // Add error boundary protection
  if (typeof index !== "number" || index < 0) {
    console.warn("Invalid index passed to DraggableQuestion:", index);
    return (
      <div className="draggable-item pb-4 p-4 mb-2 border rounded-xl shadow-sm backdrop-blur-sm bg-base-100 dark:bg-base-200 border-base-200/50 dark:border-base-200/50">
        <div className="text-error">Invalid question index</div>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={dragDropRef}
      className={`draggable-item pb-4 p-4 mb-2 border hover:shadow-primary/5 rounded-xl shadow-sm backdrop-blur-sm bg-base-100 dark:bg-base-200 border-base-200/50 dark:border-base-200/50 space-y-4
        ${isDragging ? "dragging opacity-60" : ""}
        ${
          isOver && draggedItem && draggedItem.index !== index ? "hovered" : ""
        }`}
      style={{
        transform:
          isOver && draggedItem && draggedItem.index !== index
            ? index < draggedItem.index
              ? "translateY(10px)"
              : "translateY(-10px)"
            : "translateY(0)",
        transition: isDragging
          ? "none"
          : "transform 0.3s ease, opacity 0.3s ease",
        opacity: isDragging ? 0.6 : 1,
      }}>
      {/* Drag handle */}
      <div className="w-full flex items-center gap-2 mb-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 drag-handle cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}>
          <span className="material-symbols-outlined rotate-90 text-neutral hover:text-primary transition-colors">
            drag_indicator
          </span>
        </motion.button>
        <span className="text-sm text-base-content/60">Drag to reorder</span>
      </div>
      {children}
    </div>
  );
};

const QuestionSelectType = ({ question, globalIndex, handleTypeChange }) => {
  const questionTypes = [
    {
      value: "radio",
      label: "Single Choice",
      icon: "radio_button_checked",
      color: "primary",
    },
    {
      value: "checkbox",
      label: "Multiple Choice",
      icon: "check_box",
      color: "secondary",
    },
    {
      value: "text",
      label: "Text Input",
      icon: "text_fields",
      color: "accent",
    },
    { value: "file", label: "Single File", icon: "upload_file", color: "info" },
    {
      value: "multiple_file",
      label: "Multiple Files",
      icon: "file_copy",
      color: "warning",
    },
  ];

  if (!question) {
    return (
      <div className="text-error text-sm">
        Error: Question data is not available.
      </div>
    );
  }

  return (
    <div className="form-control w-full">
      <label className="my-2.5">
        <span className="label-text font-semibold">Question Type</span>
      </label>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {questionTypes.map((type) => (
          <motion.button
            key={type.value}
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleTypeChange(globalIndex, type.value)}
            className={`btn btn-sm ${
              question.type === type.value
                ? `btn-${type.color}`
                : "btn-ghost border border-base-200/50"
            } flex flex-col items-center gap-1 h-auto py-3`}>
            <span className="material-symbols-outlined text-lg">
              {type.icon}
            </span>
            <span className="text-xs font-medium">{type.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const QuestionLoadingPlaceholder = ({ questionCount }) => (
  <div className="flex items-start w-full justify-center min-h-[100vh]">
    <div className="w-full p-4 space-y-6">
      <div className="h-6 bg-base-300 rounded w-1/3 mx-auto" />
      <div className="flex justify-between items-center">
        <div className="h-4 bg-base-300 rounded w-1/2" />
        <div className="h-4 bg-base-300 rounded w-12" />
      </div>
      {Array.from({ length: questionCount }).map((_, idx) => (
        <div
          key={idx}
          className="w-full mx-auto p-5 bg-white dark:bg-base-200 rounded-xl shadow-lg mb-6 transition-all duration-300 hover:shadow-sm relative"
          style={{ minHeight: "200px" }}>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-base-300 rounded w-6" />
            <div className="h-4 bg-base-300 rounded w-24" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-base-300 rounded w-1/4" />
            <div className="h-20 bg-base-300 rounded w-full" />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
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

const AssignmentQuestionManager = ({ assignmentId }) => {
  const isMobile = useIsMobile();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const shouldLoad = !!assignmentId && !showCreateForm;

  const {
    questions: serverQuestions,
    isLoading: serverLoading,
    error: serverError,
    editQuestions,
    reorderQuestions,
    removeQuestion,
    loadQuestions,
  } = useAssignmentQuestions(assignmentId, { autoLoad: shouldLoad });

  const [localQuestions, setLocalQuestions] = useState([]);
  const [pageLabels, setPageLabels] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [createFormIndex, setCreateFormIndex] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  const defaultFileTypes = [
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
  ];

  const fileTypeOptions = [
    { value: "application/pdf", label: "PDF" },
    { value: "application/msword", label: "Word (.doc)" },
    {
      value:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      label: "Word (.docx)",
    },
    { value: "application/vnd.ms-powerpoint", label: "PowerPoint (.ppt)" },
    {
      value:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      label: "PowerPoint (.pptx)",
    },
    { value: "text/plain", label: "Text (.txt)" },
    { value: "image/jpeg", label: "JPEG" },
    { value: "image/jpg", label: "JPG" },
    { value: "image/webp", label: "WebP" },
    { value: "image/png", label: "PNG" },
    { value: "image/gif", label: "GIF" },
  ];

  const initializedRef = useRef(false);

  // Initialize local questions from server data
  useEffect(() => {
    if (serverQuestions.length > 0) {
      const normalizedQuestions = serverQuestions.map((q, idx) => ({
        id: q.id || uuidv4(),
        assignment_id: q.assignment_id || assignmentId,
        question: q.question || "",
        type: q.type || "text",
        page: q.page || 1,
        points: q.points || 1,
        sort_order: q.sort_order ?? idx,
        options: Array.isArray(q.options) ? q.options : [],
        file_types: Array.isArray(q.file_types)
          ? q.file_types
          : (() => {
              try {
                return q.file_types
                  ? JSON.parse(q.file_types)
                  : defaultFileTypes;
              } catch {
                return defaultFileTypes;
              }
            })(),
        newOption: "",
        isNew: !q.id,
        label: q.label || null,
        is_required: Boolean(q.is_required),
        maxFiles: q.max_files || (q.type === "multiple_file" ? 5 : 1),
        maxFileSize: q.max_file_size || 40,
      }));

      const labels = {};
      normalizedQuestions.forEach((q) => {
        if (q.label && !labels[q.page]) {
          labels[q.page] = q.label;
        } else if (!labels[q.page]) {
          labels[q.page] = `Page ${q.page}`;
        }
      });

      setLocalQuestions(normalizedQuestions);
      setPageLabels(labels);

      // ✅ Jangan selalu reset ke page 1
      setCurrentPage((prev) => prev || 1);
      initializedRef.current = true;
    } else {
      setLocalQuestions([]);
      setPageLabels({ 1: "Page 1" });
      setCurrentPage(1);
    }
  }, [serverQuestions, assignmentId]);
  const questionsOnCurrentPage = useMemo(() => {
    return localQuestions
      .filter((q) => q.page === currentPage)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [localQuestions, currentPage]);

  const highestPage = useMemo(() => {
    return localQuestions.length > 0
      ? Math.max(...localQuestions.map((q) => q.page), 1)
      : 1;
  }, [localQuestions]);

  const getGlobalQuestionIndex = useCallback(
    (localIndex) => {
      const question = questionsOnCurrentPage[localIndex];
      return localQuestions.findIndex((q) => q.id === question?.id);
    },
    [localQuestions, questionsOnCurrentPage]
  );

  const handleLabelChange = useCallback(
    (e) => {
      const newLabel = e.target.value;
      setPageLabels((prev) => ({ ...prev, [currentPage]: newLabel }));
      setLocalQuestions((prev) =>
        prev.map((q) =>
          q.page === currentPage ? { ...q, label: newLabel } : q
        )
      );
    },
    [currentPage]
  );

  const handleQuestionChange = useCallback((index, field, value) => {
    setLocalQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleTypeChange = useCallback(
    (index, value) => {
      setLocalQuestions((prev) => {
        const updated = [...prev];
        const question = updated[index];

        let newOptions = question.options;
        let newFileTypes = question.file_types;
        let maxFiles = question.maxFiles;

        if (value === "radio" || value === "checkbox") {
          newOptions =
            question.options.length > 0
              ? question.options
              : [{ label: "Option 1", id: uuidv4() }];
        } else {
          newOptions = [];
        }

        if (value === "file" || value === "multiple_file") {
          newFileTypes = defaultFileTypes;
          maxFiles = value === "multiple_file" ? 5 : 1;
        } else {
          newFileTypes = [];
        }

        updated[index] = {
          ...question,
          type: value,
          options: newOptions,
          file_types: newFileTypes,
          maxFiles,
          maxFileSize: 40,
        };

        return updated;
      });
    },
    [defaultFileTypes]
  );

  const handleFileTypeChange = useCallback((index, mime, checked) => {
    setLocalQuestions((prev) => {
      const updated = [...prev];
      let newFileTypes = [...updated[index].file_types];
      if (checked) {
        if (!newFileTypes.includes(mime)) {
          newFileTypes.push(mime);
        }
      } else {
        newFileTypes = newFileTypes.filter((v) => v !== mime);
      }
      updated[index].file_types = newFileTypes;
      return updated;
    });
  }, []);

  const handleFileSettingsChange = useCallback((index, field, value) => {
    setLocalQuestions((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: Number(value),
      };
      return updated;
    });
  }, []);

  const handleOptionChange = useCallback(
    (questionIndex, optionIndex, value) => {
      setLocalQuestions((prev) => {
        const updated = [...prev];
        const options = [...updated[questionIndex].options];
        options[optionIndex] = { ...options[optionIndex], label: value };
        updated[questionIndex] = { ...updated[questionIndex], options };
        return updated;
      });
    },
    []
  );

  const handleAddOption = useCallback((questionIndex) => {
    setLocalQuestions((prev) => {
      const updated = [...prev];
      const question = updated[questionIndex];
      const optionText = (question.newOption || "").trim();

      if (!optionText) return prev;

      updated[questionIndex] = {
        ...question,
        options: [...question.options, { id: uuidv4(), label: optionText }],
        newOption: "",
      };

      return updated;
    });
  }, []);

  const handleDeleteOption = useCallback((questionIndex, optionIndex) => {
    setLocalQuestions((prev) => {
      const updated = [...prev];
      updated[questionIndex].options = updated[questionIndex].options.filter(
        (_, idx) => idx !== optionIndex
      );
      return updated;
    });
  }, []);

  const handleRequiredChange = useCallback((index, value) => {
    setLocalQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], is_required: value };
      return updated;
    });
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};

    localQuestions.forEach((q, idx) => {
      if (!q.question?.trim()) {
        errors[`questions[${idx}].question`] = "Question text is required";
      }

      if (["radio", "checkbox"].includes(q.type) && q.options.length < 2) {
        errors[`questions[${idx}].options`] =
          "At least two options are required";
      }

      if (!q.page || isNaN(q.page) || q.page < 1) {
        errors[`questions[${idx}].page`] = "Valid page number is required";
      }

      if (
        ["file", "multiple_file"].includes(q.type) &&
        q.file_types.length === 0
      ) {
        errors[`questions[${idx}].file_types`] =
          "At least one file type is required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [localQuestions]);

  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error("Please fix validation errors");
        return;
      }

      setIsSubmitting(true);

      try {
        const questionsToUpdate = localQuestions
          .filter((q) => !q.isNew)
          .map((q) => ({
            id: Number(q.id),
            question: q.question.trim(),
            type: q.type,
            options: q.options.map((opt) => ({
              label: opt.label.trim(),
              id: opt.id,
            })),
            file_types: q.file_types,
            page: q.page,
            sort_order: q.sort_order,
            label: pageLabels[q.page] || q.label || null,
            is_required: q.is_required ? 1 : 0,
            maxFiles: q.maxFiles,
            maxFileSize: q.maxFileSize,
            points: q.points,
          }));

        if (questionsToUpdate.length > 0) {
          await editQuestions(questionsToUpdate);
          // toast.success("Questions updated successfully");
        } else {
          toast.info("No changes to update");
        }
      } catch (error) {
        toast.error(error.message || "Failed to update questions");
      } finally {
        setIsSubmitting(false);
      }
    },
    [localQuestions, pageLabels, validateForm, editQuestions]
  );

  const handleDeleteQuestion = useCallback(
    async (questionId, isNew) => {
      if (isNew) {
        setLocalQuestions((prev) => prev.filter((q) => q.id !== questionId));
        // toast.success("Question deleted");
        return;
      }

      try {
        await removeQuestion(questionId);
        setLocalQuestions((prev) => prev.filter((q) => q.id !== questionId));
        // toast.success("Question deleted");
      } catch (error) {
        toast.error("Failed to delete question");
      }
    },
    [removeQuestion]
  );

  const debouncedUpdateQuestionOrder = useCallback(
    debounce(async (page, questions) => {
      setIsReordering(true);
      try {
        console.log("Updating question order:", { page, questions });
        await reorderQuestions(page, questions);
      } catch (err) {
        console.error("Failed to update question order:", err);
        toast.error("Failed to update question order");

        // Reload questions untuk sync dengan server
        try {
          await loadQuestions(true);
        } catch (reloadError) {
          console.error("Failed to reload questions:", reloadError);
        }
      } finally {
        setIsReordering(false);
      }
    }, 1000),
    [reorderQuestions, loadQuestions]
  );

  const moveQuestion = useCallback(
    (dragIndex, hoverIndex) => {
      if (dragIndex === hoverIndex) return;

      setLocalQuestions((prev) => {
        const pageQuestions = prev.filter((q) => q.page === currentPage);
        const otherQuestions = prev.filter((q) => q.page !== currentPage);
        const reordered = [...pageQuestions];

        const [moved] = reordered.splice(dragIndex, 1);
        reordered.splice(hoverIndex, 0, moved);

        // Update sort_order berdasarkan posisi baru
        const updated = reordered.map((q, idx) => ({
          ...q,
          sort_order: idx,
        }));

        const result = [...otherQuestions, ...updated].sort(
          (a, b) => a.page - b.page || a.sort_order - b.sort_order
        );

        // Kirim update ke server menggunakan data yang baru saja diupdate
        const reorderedIds = updated.map((q, idx) => ({
          id: Number(q.id),
          sort_order: idx,
        }));

        // Panggil debouncedUpdateQuestionOrder dengan data yang benar
        debouncedUpdateQuestionOrder(currentPage, reorderedIds);

        return result;
      });
    },
    [currentPage, debouncedUpdateQuestionOrder]
  );

  const handleCreateSuccess = useCallback(async (newQuestions) => {
    try {
      if (newQuestions && Array.isArray(newQuestions)) {
        setLocalQuestions((prev) => {
          const existingIds = new Set(prev.map((q) => Number(q.id)));
          // filter hanya yg belum ada
          const filtered = newQuestions.filter(
            (q) => !existingIds.has(Number(q.id))
          );

          const combined = [...prev, ...filtered];

          // reassign sort_order per page
          const normalized = combined
            .sort((a, b) => a.page - b.page || a.sort_order - b.sort_order)
            .map((q, idx, arr) => {
              const samePage = arr.filter((x) => x.page === q.page);
              const indexInPage = samePage.findIndex((x) => x.id === q.id);
              return {
                ...q,
                sort_order: indexInPage, // selalu mulai dari 0 per page
              };
            });

          return normalized;
        });

        // update page labels
        const newPageLabels = {};
        newQuestions.forEach((q) => {
          if (q.label && !newPageLabels[q.page]) {
            newPageLabels[q.page] = q.label;
          }
        });
        if (Object.keys(newPageLabels).length > 0) {
          setPageLabels((prev) => ({ ...prev, ...newPageLabels }));
        }
      }

      setShowCreateForm(false);
      setCreateFormIndex(null);
      toast.success("Questions created successfully!");
    } catch (error) {
      console.error("Failed to handle create success:", error);
      toast.error("Error updating local data");
    }
  }, []);

  if (serverLoading && localQuestions.length === 0) {
    return <QuestionLoadingPlaceholder questionCount={3} />;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        className="flex items-start w-full md:max-w-screen-sm overflow-hidden justify-center mx-auto">
        <div className="w-full p-0 md:p-4">
          {serverError && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4 shadow-lg">
              <span className="material-symbols-outlined align-middle mr-2">
                error
              </span>
              {serverError || "Failed to load questions"}
            </motion.div>
          )}

          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-2xl font-extrabold text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-6">
            Page {currentPage}
          </motion.h2>

          <div className="flex items-center justify-between w-full mb-6 bg-base-100 dark:bg-base-200 rounded-2xl p-4 shadow-sm border border-base-200/50 dark:border-base-200/50 overflow-hidden">
            <div className="w-full overflow-x-auto scrollbar-hidden overflow-y-hidden">
              <div className="flex items-center space-x-2">
                <ul className="steps w-max min-w-full flex-nowrap">
                  {Array.from({ length: highestPage }, (_, idx) => (
                    <li
                      key={idx}
                      onClick={() => {
                        setCurrentPage(idx + 1);
                        setShowCreateForm(false);
                        setCreateFormIndex(null);
                      }}
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

                  {/* ✅ Step untuk New Page */}
                  <li
                    key="new-page"
                    onClick={() => {
                      const newPage = highestPage + 1;
                      setCurrentPage(newPage);
                      setShowCreateForm(false);
                      setCreateFormIndex(null);

                      setPageLabels((prev) => ({
                        ...prev,
                        [newPage]: `Page ${newPage}`,
                      }));
                    }}
                    className={`step cursor-pointer transition-all duration-300 step-indicator flex-shrink-0 ${
                      currentPage === highestPage + 1
                        ? "step-primary text-primary font-bold active"
                        : "hover:text-primary/70 text-base-content/60"
                    }`}>
                    <PlusCircleIcon />
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6 md:mt-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="md:max-w-sm mx-auto text-center">
              <label className="block mb-2 font-semibold text-base-content/70">
                Page Label
              </label>
              <input
                type="text"
                value={pageLabels[currentPage] || ""}
                onChange={handleLabelChange}
                className="w-full p-3 border border-base-200/50 focus:border-transparent text-center outline-none bg-base-300/50 focus:bg-base-100 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300"
                placeholder="Enter page label"
              />
            </motion.div>

            <DndProvider backend={HTML5Backend}>
              {questionsOnCurrentPage.length > 0 ? (
                <AnimatePresence mode="popLayout">
                  {questionsOnCurrentPage.map((question, localIndex) => {
                    const globalIndex = getGlobalQuestionIndex(localIndex);

                    return (
                      <div
                        className="flex w-full justify-center items-start md:gap-4 relative"
                        key={question.id}>
                        <div className="w-full">
                          <DraggableQuestion
                            index={localIndex}
                            moveQuestion={moveQuestion}>
                            {/* Delete confirmation modal */}
                            <dialog
                              id={`modal-delete-${question.id}`}
                              className="modal">
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="modal-box bg-gradient-to-br from-base-100 to-base-100/90 dark:from-base-200 dark:to-base-200/90 border border-red-400/20">
                                <form method="dialog">
                                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                                    ✕
                                  </button>
                                </form>
                                <h3 className="font-bold text-lg text-center flex items-center justify-center gap-2">
                                  <span className="material-symbols-outlined text-error">
                                    delete
                                  </span>
                                  Delete question {localIndex + 1}?
                                </h3>
                                <div className="flex items-center justify-center mt-6 gap-3">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn btn-ghost w-1/2"
                                    onClick={() =>
                                      document
                                        .getElementById(
                                          `modal-delete-${question.id}`
                                        )
                                        .close()
                                    }>
                                    Cancel
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="btn btn-error text-white w-1/2"
                                    onClick={() => {
                                      handleDeleteQuestion(
                                        question.id,
                                        question.isNew
                                      );
                                      document
                                        .getElementById(
                                          `modal-delete-${question.id}`
                                        )
                                        .close();
                                    }}>
                                    <span className="material-symbols-outlined text-sm">
                                      delete
                                    </span>
                                    Delete
                                  </motion.button>
                                </div>
                              </motion.div>
                            </dialog>

                            {/* Question content */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-start justify-between flex-wrap gap-3">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm">
                                    {localIndex + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                                      Question {localIndex + 1}
                                    </h4>
                                    <span className="text-sm text-base-content/60 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-xs">
                                        description
                                      </span>
                                      Page {question.page || 1}
                                    </span>
                                  </div>
                                </div>
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className="type-badge px-4 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full text-sm font-semibold text-primary cursor-default">
                                  {question.type}
                                </motion.span>
                              </div>

                              {/* Options dropdown */}
                              <div className="dropdown absolute right-0 top-0 dropdown-left">
                                <motion.div
                                  tabIndex={0}
                                  role="button"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="flex text-neutral hover:text-primary items-center p-4 transition-colors">
                                  <span className="material-symbols-outlined">
                                    more_horiz
                                  </span>
                                </motion.div>
                                <ul
                                  tabIndex={0}
                                  className="dropdown-content menu bg-gradient-to-br from-base-100 to-base-100/95 dark:from-base-300 dark:to-base-300/95 rounded-xl z-[1] w-56 shadow-2xl border border-base-200/50 dark:border-base-200/50 overflow-hidden">
                                  <li>
                                    <div className="flex justify-between items-center hover:bg-primary/10">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm material-symbols-outlined text-info">
                                          info
                                        </span>
                                        <p className="font-medium">
                                          Question {localIndex + 1}
                                        </p>
                                      </div>
                                      <p className="text-xs text-neutral badge badge-primary badge-sm">
                                        Page {currentPage}
                                      </p>
                                    </div>
                                  </li>
                                  <li
                                    onClick={() => {
                                      setCreateFormIndex(localIndex + 1);
                                      setShowCreateForm(true);
                                    }}>
                                    <div className="flex justify-between items-center hover:bg-primary/10">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm material-symbols-outlined text-success">
                                          add_circle
                                        </span>
                                        <p className="font-medium">
                                          Add question below
                                        </p>
                                      </div>
                                    </div>
                                  </li>
                                  <li
                                    onClick={() =>
                                      document
                                        .getElementById(
                                          `modal-delete-${question.id}`
                                        )
                                        .showModal()
                                    }>
                                    <div className="text-error flex gap-2 items-center hover:bg-error/10">
                                      <span className="text-sm material-symbols-outlined">
                                        delete
                                      </span>
                                      <p className="font-medium">Delete</p>
                                    </div>
                                  </li>
                                </ul>
                              </div>
                            </div>

                            {/* Question text */}
                            <div className="space-y-4">
                              <label className="block mb-2 font-semibold text-base-content/70">
                                Question Text:
                              </label>
                              <textarea
                                value={question.question || ""}
                                onChange={(e) =>
                                  handleQuestionChange(
                                    globalIndex,
                                    "question",
                                    e.target.value
                                  )
                                }
                                className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none h-24"
                                placeholder="Enter question text"
                              />
                              {formErrors[
                                `questions[${globalIndex}].question`
                              ] && (
                                <motion.p
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-error text-sm mt-1 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">
                                    error
                                  </span>
                                  {
                                    formErrors[
                                      `questions[${globalIndex}].question`
                                    ]
                                  }
                                </motion.p>
                              )}
                            </div>
                            <div className="relative p-4 mb-4">
                              {/* Input Points di pojok kanan atas */}
                              <div className="absolute top-2 right-2">
                                <input
                                  type="number"
                                  value={question.points || 1}
                                  onChange={(e) =>
                                    handleQuestionChange(
                                      globalIndex,
                                      "points",
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-16 input input-sm input-bordered focus:input-primary text-right"
                                  min="0"
                                />
                                <span className="text-xs ml-1">Points</span>
                              </div>
                            </div>
                            {/* Required field */}
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="flex items-center gap-3 p-3 bg-gradient-to-r from-base-100 to-base-100/50 dark:from-base-300 dark:to-base-300/50 rounded-xl">
                              <input
                                type="checkbox"
                                checked={question.is_required || false}
                                onChange={(e) =>
                                  handleRequiredChange(
                                    globalIndex,
                                    e.target.checked
                                  )
                                }
                                className="checkbox checkbox-primary"
                              />
                              <label className="font-medium cursor-pointer">
                                Required Field
                              </label>
                            </motion.div>

                            {/* Question type selector */}
                            <QuestionSelectType
                              question={question}
                              globalIndex={globalIndex}
                              handleTypeChange={handleTypeChange}
                            />

                            {/* File settings */}
                            {(question.type === "file" ||
                              question.type === "multiple_file") && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="space-y-4 p-4 bg-gradient-to-r from-base-100/50 to-base-100/30 dark:from-base-300/50 dark:to-base-300/30 rounded-xl">
                                <label className="block mb-2 font-semibold text-base-content/70 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-info">
                                    description
                                  </span>
                                  Allowed File Types:
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                  {fileTypeOptions.map((opt) => (
                                    <label
                                      key={opt.value}
                                      className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={question.file_types.includes(
                                          opt.value
                                        )}
                                        onChange={(e) =>
                                          handleFileTypeChange(
                                            globalIndex,
                                            opt.value,
                                            e.target.checked
                                          )
                                        }
                                        className="checkbox checkbox-primary"
                                      />
                                      <span className="text-sm">
                                        {opt.label}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                                {formErrors[
                                  `questions[${globalIndex}].file_types`
                                ] && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-error text-sm mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">
                                      error
                                    </span>
                                    {
                                      formErrors[
                                        `questions[${globalIndex}].file_types`
                                      ]
                                    }
                                  </motion.p>
                                )}
                                {question.type === "multiple_file" && (
                                  <div className="form-control">
                                    <label className="block mb-2 font-semibold text-base-content/70">
                                      Max Files:
                                    </label>
                                    <input
                                      type="number"
                                      value={question.maxFiles || 5}
                                      onChange={(e) =>
                                        handleFileSettingsChange(
                                          globalIndex,
                                          "maxFiles",
                                          e.target.value
                                        )
                                      }
                                      className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none"
                                      min="1"
                                    />
                                  </div>
                                )}
                                <div className="form-control">
                                  <label className="block mb-2 font-semibold text-base-content/70">
                                    Max File Size (MB):
                                  </label>
                                  <input
                                    type="number"
                                    value={question.maxFileSize || 40}
                                    onChange={(e) =>
                                      handleFileSettingsChange(
                                        globalIndex,
                                        "maxFileSize",
                                        e.target.value
                                      )
                                    }
                                    className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none"
                                    min="1"
                                    max="40"
                                  />
                                </div>
                              </motion.div>
                            )}

                            {/* Options for radio/checkbox */}
                            {(question.type === "radio" ||
                              question.type === "checkbox") && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4">
                                <label className="block mb-2 font-semibold text-base-content/70 flex items-center gap-2">
                                  <span className="material-symbols-outlined text-secondary">
                                    list
                                  </span>
                                  Options:
                                </label>
                                <div className="space-y-2 p-4 bg-gradient-to-r from-base-100/50 to-base-100/30 dark:from-base-300/50 dark:to-base-300/30 rounded-xl">
                                  {question.options.length > 0 ? (
                                    <AnimatePresence>
                                      {question.options.map(
                                        (option, optionIndex) => (
                                          <motion.div
                                            key={option.id || optionIndex}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{
                                              delay: optionIndex * 0.05,
                                            }}
                                            className="flex items-center gap-3 group">
                                            <input
                                              type={question.type}
                                              checked={false}
                                              className={
                                                question.type === "radio"
                                                  ? "radio radio-primary"
                                                  : "checkbox checkbox-primary"
                                              }
                                              readOnly
                                            />
                                            <input
                                              type="text"
                                              value={option.label || ""}
                                              onChange={(e) =>
                                                handleOptionChange(
                                                  globalIndex,
                                                  optionIndex,
                                                  e.target.value
                                                )
                                              }
                                              className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none"
                                              placeholder="Enter option"
                                            />
                                            <motion.button
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                              onClick={() =>
                                                handleDeleteOption(
                                                  globalIndex,
                                                  optionIndex
                                                )
                                              }
                                              className="text-error opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                              <span className="material-symbols-outlined">
                                                delete
                                              </span>
                                            </motion.button>
                                          </motion.div>
                                        )
                                      )}
                                    </AnimatePresence>
                                  ) : (
                                    <p className="text-base-content/50 text-sm italic">
                                      No options available. Add an option below.
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="text"
                                    value={question.newOption || ""}
                                    onChange={(e) =>
                                      handleQuestionChange(
                                        globalIndex,
                                        "newOption",
                                        e.target.value
                                      )
                                    }
                                    placeholder="New option"
                                    className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddOption(globalIndex);
                                      }
                                    }}
                                  />
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAddOption(globalIndex)}
                                    className="btn btn-md btn-primary shadow-lg">
                                    {isMobile ? (
                                      <span className="material-symbols-outlined">
                                        add_circle
                                      </span>
                                    ) : (
                                      <>
                                        <span className="material-symbols-outlined text-sm">
                                          add_circle
                                        </span>
                                        Add Option
                                      </>
                                    )}
                                  </motion.button>
                                </div>
                                {formErrors[
                                  `questions[${globalIndex}].options`
                                ] && (
                                  <motion.p
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-error text-sm mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">
                                      error
                                    </span>
                                    {
                                      formErrors[
                                        `questions[${globalIndex}].options`
                                      ]
                                    }
                                  </motion.p>
                                )}
                              </motion.div>
                            )}
                          </DraggableQuestion>

                          {/* Create form */}
                          {showCreateForm &&
                            createFormIndex === localIndex + 1 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="border-l-4 border-primary pl-4 my-4">
                                <CreateQuestionByAssignment
                                  assignmentId={assignmentId}
                                  questionsOnCurrentPage={
                                    questionsOnCurrentPage
                                  }
                                  createFormIndex={createFormIndex}
                                  setShowCreateForm={setShowCreateForm}
                                  currentPage={currentPage}
                                  highestPage={highestPage}
                                  setCurrentPage={setCurrentPage}
                                  setPageLabels={setPageLabels}
                                  pageLabels={pageLabels}
                                  onSuccess={handleCreateSuccess}
                                />
                              </motion.div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12">
                  <div className="float-animation mb-6">
                    <span className="material-symbols-outlined text-6xl text-base-content/30">
                      quiz
                    </span>
                  </div>
                  <p className="text-base-content/50 mb-6 text-lg">
                    No questions on this page yet.
                  </p>
                  {showCreateForm ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border-l-4 mx-auto border-primary pl-4 my-4 max-w-4xl">
                      <CreateQuestionByAssignment
                        assignmentId={assignmentId}
                        questionsOnCurrentPage={questionsOnCurrentPage}
                        createFormIndex={questionsOnCurrentPage}
                        setShowCreateForm={setShowCreateForm}
                        currentPage={currentPage}
                        highestPage={highestPage}
                        setCurrentPage={setCurrentPage}
                        setPageLabels={setPageLabels}
                        pageLabels={pageLabels}
                        onSuccess={handleCreateSuccess}
                      />
                    </motion.div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (!showCreateForm) {
                          setShowCreateForm(true);
                          setCreateFormIndex(0);
                          setCurrentPage(currentPage);
                        }
                      }}
                      disabled={showCreateForm}
                      className="btn btn-primary btn-md shadow-sm">
                      <span className="material-symbols-outlined">
                        add_circle
                      </span>
                      Add Your First Question
                    </motion.button>
                  )}
                </motion.div>
              )}
            </DndProvider>

            {/* Add question button */}
            {questionsOnCurrentPage.length > 0 && !showCreateForm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowCreateForm(true);
                    setCreateFormIndex(questionsOnCurrentPage.length);
                  }}
                  className="btn btn-primary btn-md shadow-sm">
                  <span className="material-symbols-outlined">add_circle</span>
                  Add Question
                </motion.button>
              </motion.div>
            )}

            {/* Update button */}
            {questionsOnCurrentPage.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-end mt-8 pt-6 border-t border-base-200/50 dark:border-base-200/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdate}
                  disabled={isSubmitting || isReordering}
                  className={`btn btn-success btn-md shadow-sm ${
                    isSubmitting ? "loading" : ""
                  }`}>
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner"></span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      Update Questions
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AssignmentQuestionManager;
