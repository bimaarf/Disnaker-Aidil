import React, { useEffect, useState } from "react";
// import "react-quill/dist/quill.snow.css";
import "react-quill/dist/react-quill";

import { useDispatch, useSelector } from "react-redux";
import { fetchContacts } from "../features/LandingPages/contactSlice";
export const ContactFooter = () => {
  const dispatch = useDispatch();
  const contacts = useSelector((state) => state.contacts.contacts);
  const status = useSelector((state) => state.contacts.status);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const getBody = async () => {
      try {
        await dispatch(fetchContacts()).unwrap();
      } catch (error) {
        console.error("Failed to fetch body data:", error.message || error);
      } finally {
        setLoading(false);
      }
    };

    getBody();
  }, [dispatch]);
  const convertToDefaultFormat = (value) => {
    if (!value) return value;

    // Menghapus karakter non-digit dan mengembalikan ke format asli
    return value.replace(/[^0-9]/g, "").replace(/^0/, ""); // Menghapus angka 0 di awal
  };

  return (
    <div className="overflow-hidden">
      {loading && status !== "loading" ? (
        <div
          id="data-modal-description"
          className="text-sm h-10 w-full skeleton"></div>
      ) : (
        <>
          <div className="divider">Contact</div>
          <div className="text-md">
            {contacts ? (
              <div className="space-y-4 md:space-y-4 justify-start overflow-hidden items-center w-full gap-2">
                <div className="text-sm h-10 flex items-center justify-center w-full">
                  <a
                    href={`mailto:${contacts?.email}`}
                    target="__blank"
                    className="p-2 bg-base-300/80 focus-within:bg-base-100 rounded-lg w-full input-bordered flex items-center gap-2">
                    <span className="fas font-bold text-xl fa-envelope text-info"></span>
                    <p className="grow bg-transparent">{contacts?.email}</p>
                  </a>
                </div>
                <div className="text-sm h-10 flex items-center justify-center w-full">
                  <a
                    href={`https://wa.me/${convertToDefaultFormat(
                      contacts?.whatsapp
                    )}`}
                    target="__blank"
                    className="p-2 bg-base-300/80 focus-within:bg-base-100 rounded-lg w-full input-bordered flex items-center gap-2">
                    <span className="fa-brands font-bold text-xl fa-whatsapp text-success"></span>

                    <p className="grow bg-transparent">
                      {convertToDefaultFormat(contacts?.whatsapp)}
                    </p>
                  </a>
                </div>
                <div className="text-sm h-10 flex items-center justify-center w-full">
                  <a
                    href={`t.me/${contacts?.telegram}`}
                    target="__blank"
                    className="p-2 bg-base-300/80 focus-within:bg-base-100 rounded-lg w-full input-bordered flex items-center gap-2">
                    <span className="fa-brands font-bold text-xl fa-telegram text-blue-700"></span>

                    <p className="grow bg-transparent">{contacts?.telegram}</p>
                  </a>
                </div>
              </div>
            ) : (
              <div
                id="data-modal-description"
                className="text-sm h-10 w-full skeleton"></div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
