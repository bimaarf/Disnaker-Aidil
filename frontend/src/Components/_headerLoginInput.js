import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login } from "../features/authentication/AuthSlice";

export const HeaderLoginInput = ({ theme }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [visibility, setVisibility] = useState(false);

  const handleLogin = async () => {
    try {
      const result = await dispatch(login(formData)).unwrap();
      if (result?.token) {
        toast.success("Logged In Successfully!");
        navigate("/");
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleError = (error) => {
    const errorMessage =
      error.validation_error?.[0] ||
      error.message ||
      "Login failed. Please try again.";
    toast.error(errorMessage);
    console.error("Login failed:", error);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="form-control">
          <label
            className={`px-2 py-1.5 from-${theme?.name}-950/10 via-${theme?.name}-950/10 to-${theme?.name}-950/10 bg-gradient-to-r w-40  border border-base-300 flex items-center gap-2 text-[14px]`}>
            <span className="material-symbols-outlined text-[18px]">mail</span>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="grow bg-transparent w-full h-full outline-none border-none text-[12px] font-medium"
              placeholder="Alamat Email"
              required
            />
          </label>
        </div>
        <div className="form-control">
          <label
            className={`px-2 py-1.5 from-${theme?.name}-950/10 via-${theme?.name}-950/10 to-${theme?.name}-950/10 bg-gradient-to-r w-40  border border-base-300 flex items-center gap-2 text-[14px]`}>
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <input
              type={!visibility ? "password" : "text"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="grow bg-transparent w-full h-full outline-none border-none text-[12px] font-medium"
              placeholder="Kata Sandi"
              required
            />
            <span
              onClick={() => setVisibility(!visibility || false)}
              className="material-symbols-outlined text-[18px] cursor-pointer">
              {visibility ? "visibility" : "visibility_off"}
            </span>
          </label>
        </div>
        <button
          onClick={handleLogin}
          className={`px-4 w-24 py-1 rounded-full text-center bg-gradient-to-b hover:bg-gradient-to-t duration-200 from-${theme?.name}-700/50 to-${theme?.name}-700/30 text-[12px] uppercase font-medium text-white`}>
          Masuk{" "}
        </button>
        <button
          onClick={() => navigate("/register")}
          className={`px-4 w-24 py-1 rounded-full text-center bg-gradient-to-b hover:bg-gradient-to-t duration-200 from-yellow-400/80 to-yellow-300/30 text-[12px] uppercase font-medium text-white`}>
          Daftar{" "}
        </button>
      </div>
    </>
  );
};
