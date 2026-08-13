import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ImagesBg from "./components/Images/slide-1.jpg";
import useIsMobile from "../Context/__useIsMobile";

import "../App.css";
import "react-quill/dist/quill.snow.css";

import { fetchBody } from "../features/LandingPages/bodySlice";
export const RegisterEnggang = () => {
  const logo = useSelector((state) => state.logos.logos);
  const isMobile = useIsMobile();
  const GoogleFormLink = () => {
    return (
      <div className="w-full flex justify-center">
        <a
          href="https://docs.google.com/forms/d/e/1FAIpQLSdrgpVdii-R4A8Jf98sMc-sxHKObpjfq9JrbS3wAffflFXzAg/viewform"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-500 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
          Buka Formulir Pendaftaran
        </a>
      </div>
    );
  };
  const body = useSelector((state) => state.body.body);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchBody())
      .unwrap()
      .catch((error) => console.error("Failed to fetch datas:", error));
  }, [dispatch]);
  return (
    <div className="bg-base-300/30">
      <div className="relative">
        {/* Background Image */}
        <div
          style={{
            backgroundImage: `url(${ImagesBg})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            height: "50vh", // Set background image height to 50vh
            width: "100%",
          }}
          className="absolute w-full top-0"></div>

        {/* Form Container */}
        <div className="relative max-w-screen-lg mx-auto pt-32 z-10 p-10 rounded">
          <div className="text-white flex items-center gap-1 font-medium my-4 text-xl md:text-3xl ">
            <span className="material-symbols-outlined">assignment</span>
            <h1 className="underline underline-offset-8">
              Formulir Pendaftaran
            </h1>
          </div>
          <div className="bg-base-200 p-4 text-pretty rounded w-full">
            <div className={`${isMobile ? "" : ""}`}>
              <div className="flex justify-center items-center w-full">
                <img
                  className="rounded-xl"
                  width={isMobile ? "80" : "180"}
                  src={`${process.env.REACT_APP_API}logo/images/${logo?.image}`}
                />
              </div>
            </div>
            <div className="max-w-screen-md mx-auto">
              <div
                id="data-modal-title"
                className="prose"
                dangerouslySetInnerHTML={{ __html: body?.title_formulir }}
              />
              <div
                id="data-modal-body"
                className="prose"
                dangerouslySetInnerHTML={{ __html: body?.body_formulir }}
              />
              <div className="mt-4">
                <GoogleFormLink />
              </div>
            </div>
            {/* <RegisterFormCreatePage /> */}
          </div>
        </div>
      </div>
    </div>
  );
};
