import React, { useEffect, useState } from "react";

import ImagesBg from "../Images/bg-home.jpg";
import { Footer } from "./Components/_Footer";
import { useParams } from "react-router-dom";
import axios from "axios";

export const BlogDetail = () => {
  const { slug } = useParams();
  const [getBlog, setBlog] = useState("");
  const getBlogAPI = async () => {
    await axios.get("sanctum/csrf-cookie").then(() => {
      axios.get("api/blog/view/?slug=" + slug.split(":")[1]).then((res) => {
        setBlog(res.data);
      });
    });
  };
  useEffect(() => {
    getBlogAPI();
  }, []);
  return (
    <>
      <div
        style={{
          backgroundImage: `url(${ImagesBg})`,
        }}>
        <div className="flex justify-center pb-20 xl:pb-14 pt-40 px-4 sm:pt-48 lg:pt-52 xl:pt-28">
          <div className="bg-white bg-opacity-50 md:w-1/2 p-3 md:p-10">
            <h1 className="text-center text-xl md:text-3xl text-black font-semibold">
              {getBlog.title}
            </h1>
          </div>
        </div>
      </div>
      <div className="bg-white flex justify-center p-10">
        <div className="md:w-1/2">
          <i className="fa fa-tag text-orange-700"></i>
          <span className="font-medium mx-1 text-orange-700">
            {getBlog.category_name}
          </span>
          <div className="whitespace-pre-wrap font-normal">
            <span className="text-gray-800 font-bold">Mempawah Mangrove. </span>
            <span className="text-gray-800 font-normal">{getBlog.body}</span>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
