import React from "react";
import ImagesBg from "../Images/bg-home.jpg";
import { Footer } from "./Components/_Footer";
import { useNavigate } from "react-router-dom";
export const NotFound = () => {
  const navRedirect = useNavigate();
  return (
    <>
      <div
        style={{
          backgroundImage: `url(${ImagesBg})`,
        }}>
        <div className="flex justify-center pb-20 xl:pb-14 pt-40 px-4 sm:pt-48 lg:pt-52 xl:pt-28">
          <div className="bg-white bg-opacity-50 md:w-1/2 p-3 md:p-10">
            <h1 className="text-center text-xl md:text-3xl text-black font-semibold">
              Halaman Tidak Tersedia
              <div className="flex justify-center">
                <p
                  onClick={() => navRedirect("/")}
                  className="text-center text-sm lg:text-xl cursor-pointer w-2/3 lg:w-1/2 text-white font-medium bg-blue-600 hover:bg-orange-700 duration-300 hover:bg-opacity-60 bg-opacity-60 p-2 lg:p-4 mt-4 rounded-xl hover:w-2/3">
                  Kembali ke Beranda
                </p>
              </div>
            </h1>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
