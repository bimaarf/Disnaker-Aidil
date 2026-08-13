import React, { useEffect, useState } from "react";
// import "react-quill/dist/quill.snow.css";
import "react-quill/dist/react-quill";

import { useDispatch, useSelector } from "react-redux";
import { fetchBody } from "../../../../features/LandingPages/bodySlice";
import "../../../../App.css";
export const BodyPreview = () => {
  const dispatch = useDispatch();
  const body = useSelector((state) => state.body.body);
  const status = useSelector((state) => state.body.status);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");

  useEffect(() => {
    setLoading(true);
    const getBody = async () => {
      try {
        await dispatch(fetchBody()).unwrap();
      } catch (error) {
        console.error("Failed to fetch body data:", error.message || error);
      } finally {
        setLoading(false);
      }
    };

    getBody();
  }, [dispatch]);

  useEffect(() => {
    if (body?.description) {
      setDescription(body.description);
    }
  }, [body]);

  return (
    <div>
      {loading && status !== "loading" ? (
        <div
          id="data-modal-description"
          className="text-sm whitespace-pre-line prose h-10 w-full skeleton"></div>
      ) : (
        <>
          {/* <div className="divider">About</div> */}
          <div className="text-md">
            {description && (
              <div
                id="data-modal-description"
                className="text-sm whitespace-pre-line prose ql-editor"
                dangerouslySetInnerHTML={{ __html: description }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};
