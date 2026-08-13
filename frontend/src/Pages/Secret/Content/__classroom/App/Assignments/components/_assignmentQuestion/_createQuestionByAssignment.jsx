import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import { useAssignmentQuestions } from "../../../../../../../../features/classroom/assignmentQuestionHook";
import useIsMobile from "../../../../../../../../Context/__useIsMobile";

const CreateQuestionByAssignment = ({
  assignmentId,
  currentPage,
  setPageLabels,
  pageLabels,
  createFormIndex,
  setShowCreateForm,
  onSuccess,
}) => {
  const { addQuestions } = useAssignmentQuestions(assignmentId);
  const isMobile = useIsMobile();

  // Updated default file types to match MIME types used in parent component
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

  const [formData, setFormData] = useState({
    label: pageLabels[currentPage] || "",
    questions: [
      {
        id: uuidv4(),
        question: "",
        type: "radio",
        assignmentId: assignmentId,
        options: [{ label: "Option 1", id: uuidv4() }],
        newOption: "",
        selectedOption: "",
        file_types: [],
        page: currentPage,
        sort_order: createFormIndex || 0,
        is_required: false,
        maxFiles: 1,
        maxFileSize: 40,
        points: 1, // default
        max_points: 1, // default
      },
    ],
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Update form data when currentPage or createFormIndex changes
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      label: pageLabels[currentPage] || "",
      questions: prev.questions.map((q) => ({
        ...q,
        page: currentPage,
        sort_order: createFormIndex || 0,
      })),
    }));
  }, [currentPage, createFormIndex, pageLabels]);

  // const handlePreviousPage = useCallback(() => {
  //   if (currentPage > 1) {
  //     const prevPage = currentPage - 1;
  //     setCurrentPage(prevPage);
  //   }
  // }, [currentPage, setCurrentPage]);

  const handleQuestionChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  const handleTypeChange = useCallback(
    (index, value) => {
      setFormData((prev) => {
        const updatedQuestions = [...prev.questions];
        let newOptions = updatedQuestions[index].options;
        let newFileTypes = [];
        let maxFiles = 1;
        let maxFileSize = 40;

        if (value === "radio" || value === "checkbox") {
          newOptions =
            newOptions.length > 0
              ? [...newOptions]
              : [{ label: "Option 1", id: uuidv4() }];
        } else {
          newOptions = [];
        }

        if (value === "file" || value === "multiple_file") {
          newFileTypes = [...defaultFileTypes];
          maxFiles = value === "multiple_file" ? 5 : 1;
          maxFileSize = 40;
        }

        updatedQuestions[index] = {
          ...updatedQuestions[index],
          type: value,
          options: newOptions,
          selectedOption: "",
          file_types: newFileTypes,
          maxFiles,
          maxFileSize,
        };

        return { ...prev, questions: updatedQuestions };
      });
    },
    [defaultFileTypes]
  );

  const handleAddOption = useCallback(
    (questionIndex) => {
      const optionText = formData.questions[questionIndex].newOption.trim();
      if (optionText) {
        setFormData((prev) => {
          const updatedQuestions = [...prev.questions];
          updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            options: [
              ...updatedQuestions[questionIndex].options,
              { label: optionText, id: uuidv4() },
            ],
            newOption: "",
          };
          return { ...prev, questions: updatedQuestions };
        });
      } else {
        toast.error("Please enter a valid option");
      }
    },
    [formData.questions]
  );

  const handleDeleteOption = useCallback((questionIndex, optionIndex) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[questionIndex].options = updatedQuestions[
        questionIndex
      ].options.filter((_, i) => i !== optionIndex);
      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  const handleFileTypeChange = useCallback((questionIndex, mime, checked) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      let newFileTypes = [...updatedQuestions[questionIndex].file_types];

      if (checked) {
        if (!newFileTypes.includes(mime)) {
          newFileTypes.push(mime);
        }
      } else {
        newFileTypes = newFileTypes.filter((v) => v !== mime);
      }

      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        file_types: newFileTypes,
      };

      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  const handleFileSettingsChange = useCallback(
    (questionIndex, field, value) => {
      setFormData((prev) => {
        const updatedQuestions = [...prev.questions];
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          [field]: Number(value),
        };
        return { ...prev, questions: updatedQuestions };
      });
    },
    []
  );

  const handleRequiredChange = useCallback((index, value) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = {
        ...updatedQuestions[index],
        is_required: value,
      };
      return { ...prev, questions: updatedQuestions };
    });
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    formData.questions.forEach((question, index) => {
      if (!question.question?.trim()) {
        errors[`questions.${index}.question`] = "Question text is required";
      }

      if (
        ["radio", "checkbox"].includes(question.type) &&
        question.options.length < 2
      ) {
        errors[`questions.${index}.options`] =
          "At least 2 options are required for radio or checkbox questions";
      }

      if (
        ["file", "multiple_file"].includes(question.type) &&
        (!Array.isArray(question.file_types) ||
          question.file_types.length === 0)
      ) {
        errors[`questions.${index}.file_types`] =
          "At least one file type is required";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.questions]);

  const handleCreate = useCallback(
    async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      if (!validateForm()) {
        setIsSubmitting(false);
        toast.error("Please fix validation errors");
        return;
      }

      try {
        // ambil length dari questions di page saat ini
        const baseSort = createFormIndex || 0;

        const newData = formData.questions.map((question) => ({
          question: question.question.trim(),
          type: question.type,
          options: question.options.map((opt) => ({
            label: opt.label.trim(),
            id: opt.id,
          })),
          file_types: question.file_types || [],
          page: currentPage,
          sort_order: baseSort, // ✅ bukan createFormIndex lagi
          is_required: question.is_required ? 1 : 0,
          max_files: question.maxFiles || 1,
          max_file_size: question.maxFileSize || 40,
          label: formData.label.trim() || `Page ${currentPage}`,
          points: question.points || 1,
          max_points: question.max_points || 1,
        }));

        const result = await addQuestions(newData);

        setPageLabels((prev) => ({
          ...prev,
          [currentPage]: formData.label.trim() || `Page ${currentPage}`,
        }));

        if (typeof onSuccess === "function") {
          await onSuccess(result.questions);
        }
      } catch (error) {
        console.error("Error creating questions:", error);
        toast.error(
          error?.message || error?.error || "Failed to create questions"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      currentPage,
      createFormIndex,
      validateForm,
      addQuestions,
      setPageLabels,
      onSuccess,
    ]
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      className="max-w-4xl w-full p-6 bg-base-100 dark:bg-base-200 rounded-2xl shadow-sm backdrop-blur-sm border border-base-200/50 dark:border-base-200/50">
      <form onSubmit={handleCreate} className="space-y-6">
        {/* Page Label Input */}
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="form-control">
          <div className="my-2.5">
            <span className="label-text font-semibold">Page Label</span>
          </div>
          <input
            type="text"
            value={formData.label}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, label: e.target.value }))
            }
              className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none"
            placeholder={`Page ${currentPage}`}
          />
        </motion.div> */}

        {formErrors.general && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="alert alert-error shadow-lg">
            <span className="material-symbols-outlined">error</span>
            <span>{formErrors.general}</span>
          </motion.div>
        )}

        <AnimatePresence>
          {formData.questions.map((question, questionIndex) => (
            <motion.div
              key={question.id || questionIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: questionIndex * 0.1 }}
              className="">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm">
                    {(createFormIndex || 0) + questionIndex + 1}
                  </span>
                  Question {(createFormIndex || 0) + questionIndex + 1}
                </h3>
                <span className="badge badge-primary">Page {currentPage}</span>
              </div>
              <div className="relative p-4 mb-4">
                {/* Input Points di pojok kanan atas */}
                <div className="absolute top-2 right-2">
                  <input
                    type="number"
                    value={question.points || 1}
                    onChange={(e) =>
                      handleQuestionChange(
                        questionIndex,
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

              {/* Question Text */}
              <div className="form-control">
                <divp className="my-2.5">
                  <span className="label-text font-semibold">
                    Question Text *
                  </span>
                </divp>
                <textarea
                  value={question.question || ""}
                  onChange={(e) =>
                    handleQuestionChange(
                      questionIndex,
                      "question",
                      e.target.value
                    )
                  }
                  className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none h-24"
                  placeholder="Enter question text"
                />
                {formErrors[`questions.${questionIndex}.question`] && (
                  <motion.label
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="my-2.5">
                    <span className="label-text-alt text-error flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        error
                      </span>
                      {formErrors[`questions.${questionIndex}.question`]}
                    </span>
                  </motion.label>
                )}
              </div>

              {/* Required Field */}
              <div className="form-control">
                <div className="my-2 cursor-pointer flex items-center justify-start gap-4 rounded-lg p-2">
                  <input
                    type="checkbox"
                    checked={question.is_required}
                    onChange={(e) =>
                      handleRequiredChange(questionIndex, e.target.checked)
                    }
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text font-medium">Required Field</span>
                </div>
              </div>

              {/* Question Type */}
              <div className="form-control">
                <div className="my-2.5">
                  <span className="label-text font-semibold">
                    Question Type
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {questionTypes.map((type) => (
                    <motion.button
                      key={type.value}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        handleTypeChange(questionIndex, type.value)
                      }
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

              {/* File Settings */}
              {(question.type === "file" ||
                question.type === "multiple_file") && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 p-4 bg-gradient-to-r from-base-100/50 to-base-100/30 dark:from-base-300/50 dark:to-base-300/30 rounded-xl">
                  <div className="block mb-2 font-semibold text-base-content/70 flex items-center gap-2">
                    <span className="material-symbols-outlined text-info">
                      description
                    </span>
                    Allowed File Types:
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {fileTypeOptions.map((opt) => (
                      <div
                        key={opt.value}
                        className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={question.file_types.includes(opt.value)}
                          onChange={(e) =>
                            handleFileTypeChange(
                              questionIndex,
                              opt.value,
                              e.target.checked
                            )
                          }
                          className="checkbox checkbox-primary"
                        />
                        <span className="text-sm">{opt.label}</span>
                      </div>
                    ))}
                  </div>

                  {formErrors[`questions.${questionIndex}.file_types`] && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-error text-sm mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">
                        error
                      </span>
                      {formErrors[`questions.${questionIndex}.file_types`]}
                    </motion.p>
                  )}

                  {question.type === "multiple_file" && (
                    <div className="form-control">
                      <div className="my-2.5">
                        <span className="label-text font-semibold">
                          Max Files:
                        </span>
                      </div>
                      <input
                        type="number"
                        value={question.maxFiles || 5}
                        onChange={(e) =>
                          handleFileSettingsChange(
                            questionIndex,
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
                    <div className="my-2.5">
                      <span className="label-text font-semibold">
                        Max File Size (MB):
                      </span>
                    </div>
                    <input
                      type="number"
                      value={question.maxFileSize || 40}
                      onChange={(e) =>
                        handleFileSettingsChange(
                          questionIndex,
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
              {(question.type === "radio" || question.type === "checkbox") && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="form-control">
                  <div className="my-2.5">
                    <span className="label-text font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary">
                        list
                      </span>
                      Options:
                    </span>
                    <span className="label-text-alt">
                      {question.options.length} option
                      {question.options.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-2 p-4 bg-gradient-to-r from-base-100/50 to-base-100/30 dark:from-base-300/50 dark:to-base-300/30 rounded-xl">
                    <AnimatePresence>
                      {question.options.map((option, optionIndex) => (
                        <motion.div
                          key={option.id || optionIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: optionIndex * 0.05 }}
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
                            value={option.label}
                            onChange={(e) =>
                              handleQuestionChange(
                                questionIndex,
                                "options",
                                question.options.map((opt, idx) =>
                                  idx === optionIndex
                                    ? { ...opt, label: e.target.value }
                                    : opt
                                )
                              )
                            }
                            className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none"
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() =>
                              handleDeleteOption(questionIndex, optionIndex)
                            }
                            className="btn btn-circle btn-sm btn-ghost text-error opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-sm">
                              delete
                            </span>
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="text"
                      value={question.newOption}
                      onChange={(e) =>
                        handleQuestionChange(
                          questionIndex,
                          "newOption",
                          e.target.value
                        )
                      }
                      placeholder="Add new option..."
                      className="w-full p-3 border border-base-200/50 focus:border-transparent outline-none bg-base-300/50 focus:bg-base-300/30 dark:bg-base-300 dark:focus:bg-base-200 focus:shadow-lg rounded-xl transition-all duration-300 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddOption(questionIndex);
                        }
                      }}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAddOption(questionIndex)}
                      className="btn btn-primary btn-md">
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

                  {formErrors[`questions.${questionIndex}.options`] && (
                    <motion.label
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="my-2.5">
                      <span className="label-text-alt text-error flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">
                          error
                        </span>
                        {formErrors[`questions.${questionIndex}.options`]}
                      </span>
                    </motion.label>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Form Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row justify-between gap-4 pt-6 border-t-2 border-base-200/50 dark:border-base-200/50">
          {/* <div className="flex gap-2 md:gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={currentPage <= 1}
              onClick={handlePreviousPage}
              className="btn btn-outline btn-warning">
              <span className="material-symbols-outlined">arrow_back</span>
              Previous Page
            </motion.button>
          </div> */}

          <div className="flex gap-2 md:gap-4 justify-end">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateForm(false)}
              className="btn btn-ghost">
              <span className="material-symbols-outlined">close</span>
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isSubmitting}
              className="btn btn-primary shadow-lg">
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Creating...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">add_task</span>
                  Add Questions
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </form>
    </motion.div>
  );
};

export default CreateQuestionByAssignment;
