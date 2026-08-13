import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchAnswerGroup,
  respondentCache,
  setSubmissionPageForUser,
} from "../../../../../features/ppdb/answerSlice";
import { selectUser } from "../../../../../features/authentication/AuthSlice";

export const CurrentSubmitted = ({ userProps }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);

  // Tentukan userId dengan prioritas: userProps > currentUser > null
  const userId = userProps?.id || currentUser?.id || null;

  // Submission state
  const submissions = useSelector(
    (state) => state.answers.submissionsByUser?.[userId]?.data || []
  );

  const currentPageSubmissions = useSelector(
    (state) => state.answers.submissionsByUser?.[userId]?.current_page || 1
  );

  const totalPagesSubmissions = useSelector(
    (state) => state.answers.submissionsByUser?.[userId]?.last_page || 1
  );

  const isLoadingSubmissions = useSelector(
    (state) =>
      state.status === "loading" && !state.answers.submissionsByUser?.[userId]
  );

  const [noMoreSubmissions, setNoMoreSubmissions] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const isFetchingRef = useRef(false);
  const abortControllerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Fetch submissions
  const fetchSubmissions = useCallback(
    async (params, retryCount = 3) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const cacheKey = JSON.stringify({
        ...params,
        user_id: userId,
      });

      if (respondentCache.has(cacheKey)) {
        dispatch({
          type: "answers/fetchAnswerGroup/fulfilled",
          payload: respondentCache.get(cacheKey),
        });
        isFetchingRef.current = false;
        return;
      }

      try {
        setError(null);
        const result = await dispatch(
          fetchAnswerGroup({
            ...params,
            user_id: userId,
            userAll: false,
            signal: abortControllerRef.current.signal,
          })
        ).unwrap();

        respondentCache.set(cacheKey, result);
        isFetchingRef.current = false;
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        if (retryCount > 0) {
          setTimeout(() => fetchSubmissions(params, retryCount - 1), 1000);
          setError(`Retrying... (${retryCount} attempts left)`);
        } else {
          setError(err.message || "Failed to load submissions");
          isFetchingRef.current = false;
        }
      }
    },
    [dispatch, userId]
  );

  // Trigger fetch
  useEffect(() => {
    if (
      userId &&
      !isFetchingRef.current &&
      currentPageSubmissions <= totalPagesSubmissions
    ) {
      isFetchingRef.current = true;
      fetchSubmissions({
        page: currentPageSubmissions,
        perPage: 10,
        fromCache: true,
      });
    }
  }, [userId, fetchSubmissions, currentPageSubmissions, totalPagesSubmissions]);

  // Infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          currentPageSubmissions < totalPagesSubmissions &&
          !isFetchingRef.current &&
          !isLoadingSubmissions &&
          !isLoadingMore
        ) {
          setIsLoadingMore(true);
          dispatch(
            setSubmissionPageForUser({
              userId,
              page: currentPageSubmissions + 1,
            })
          );
        }
      },
      { threshold: 0.1 }
    );
    const loadMoreRefCurrent = loadMoreRef.current;
    if (loadMoreRefCurrent) {
      observer.observe(loadMoreRefCurrent);
    }
    return () => {
      if (loadMoreRefCurrent) {
        observer.unobserve(loadMoreRefCurrent);
      }
    };
  }, [
    currentPageSubmissions,
    totalPagesSubmissions,
    isLoadingSubmissions,
    isLoadingMore,
  ]);

  // Update noMoreSubmissions
  useEffect(() => {
    if (currentPageSubmissions >= totalPagesSubmissions) {
      setNoMoreSubmissions(true);
    }
    setIsLoadingMore(false);
  }, [currentPageSubmissions, totalPagesSubmissions]);

  // Filter unique submissions
  const uniqueSubmissions = useMemo(() => {
    const seen = new Set();
    return submissions.filter((item) => {
      if (!item || !item.submission_id || seen.has(item.submission_id))
        return false;
      seen.add(item.submission_id);
      return true;
    });
  }, [submissions]);

  // Status badge component
  const StatusBadge = ({ status }) => {
    const getStatusStyle = (status) => {
      switch (status?.toLowerCase()) {
        case "approved":
          return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
        case "pending":
          return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        case "rejected":
          return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
      }
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
          status
        )}`}>
        {status || "Unknown"}
      </span>
    );
  };

  // Format date helper
  const formatDate = (dateString) => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(dateString));
    } catch {
      return "Invalid Date";
    }
  };

  const SubmissionPlaceholder = () => {
    return (
      <div className="bg-base-100 border border-base-300 rounded-xl px-2 py-2 sm:px-3 sm:py-2 animate-pulse">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
            <div className="h-4 bg-neutral/30 rounded w-full sm:w-2/3" />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="h-3 bg-neutral/20 rounded w-16 sm:w-20" />
              <div className="h-3 bg-neutral/20 rounded w-20 sm:w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral mt-1">
            {uniqueSubmissions.length > 0
              ? `${uniqueSubmissions.length} submission${
                  uniqueSubmissions.length !== 1 ? "s" : ""
                } found`
              : ""}
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="alert alert-error shadow-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1 ml-2 sm:ml-3">
              <p className="font-medium text-sm sm:text-base">
                Error loading submissions
              </p>
              <p className="text-xs sm:text-sm opacity-80 mt-1">{error}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-0">
            <button
              className="btn btn-xs sm:btn-sm btn-outline"
              onClick={() => {
                setError(null);
                dispatch(setSubmissionPageForUser({ userId, page: 1 }));
                isFetchingRef.current = false;
              }}>
              Clear
            </button>
            <button
              className="btn btn-xs sm:btn-sm btn-primary"
              onClick={() =>
                fetchSubmissions({ page: currentPageSubmissions, perPage: 10 })
              }>
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingSubmissions &&
        uniqueSubmissions.length === 0 &&
        status !== "loading" &&
        !error && (
          <div className="text-center py-8 sm:py-12">
            <div className="mx-auto w-16 h-16 sm:w-24 sm:h-24 bg-base-200 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl sm:text-4xl text-neutral material-symbols-outlined">
                assignment
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-base-content mb-2">
              No submissions yet
            </h3>
            <p className="text-sm sm:text-base text-neutral px-4">
              Your submissions will appear here once you start completing forms.
            </p>
          </div>
        )}

      {/* Submissions Grid */}
      {!isLoadingSubmissions && uniqueSubmissions.length > 0 && (
        <div className="grid gap-3 sm:gap-4">
          {uniqueSubmissions.map((submission) => (
            <div
              key={submission.submission_id}
              onClick={() =>
                navigate(`/form/respondent/preview/${submission.submission_id}`)
              }
              className="group bg-base-100 border border-base-300 rounded-xl px-2 py-2 sm:px-3 sm:py-2 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200 active:scale-[0.98] sm:hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <span className="text-lg sm:text-2xl text-primary material-symbols-outlined">
                      assignment
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base-content text-sm sm:text-md mb-2 whitespace-wrap">
                      {submission.period?.title || "Untitled Submission"}
                    </h3>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <StatusBadge
                        status={submission.validation_status?.label}
                      />
                      <span className="text-xs sm:text-xs text-neutral">
                        {formatDate(submission.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex-shrink-0 ml-2 sm:ml-4">
                  <button className="btn btn-xs sm:btn-sm btn-ghost btn-circle group-hover:btn-primary group-hover:text-primary-content transition-all">
                    <span className="text-base sm:text-lg material-symbols-outlined">
                      visibility
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more section */}
      <div ref={loadMoreRef} className="h-4" />

      {isLoadingMore && (
        <div className="grid gap-3 sm:gap-4 py-4 sm:py-6">
          {[...Array(3)].map((_, i) => (
            <SubmissionPlaceholder key={i} />
          ))}
        </div>
      )}

      {!noMoreSubmissions &&
        !isLoadingSubmissions &&
        !isLoadingMore &&
        uniqueSubmissions.length > 0 && (
          <div className="text-center py-4">
            <button
              className="btn btn-outline btn-sm sm:btn-md w-full sm:btn-wide"
              onClick={() => {
                setIsLoadingMore(true);
                dispatch(
                  setSubmissionPageForUser({
                    userId,
                    page: currentPageSubmissions + 1,
                  })
                );
              }}>
              Load More Submissions
              <span className="material-symbols-outlined ml-2">
                expand_more
              </span>
            </button>
          </div>
        )}

      {noMoreSubmissions && uniqueSubmissions.length > 0 && (
        <div className="text-center py-4">
          <p className="text-neutral text-xs sm:text-sm">
            {`You've reached the end of your submissions`}
          </p>
        </div>
      )}
    </div>
  );
};
