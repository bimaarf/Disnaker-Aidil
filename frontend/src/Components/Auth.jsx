import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import secureLocalStorage from "react-secure-storage";
import { toast } from "react-toastify";
import useIsMobile from "../Context/__useIsMobile";
import { login, selectUser } from "../features/authentication/AuthSlice";
import { fetchLogos } from "../features/LandingPages/logoSlice";
import RegisterForm from "./__registerForm";
import { CircularLoader } from "./_CircularLoader";

export const Auth = ({ setAuth, setIsAuthForm, isAuthForm }) => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.themes.theme);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { status, error } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const { logos: logo, status: statusLogo } = useSelector(
    (state) => state.logos
  );
  const isMobile = useIsMobile();
  const [visibility, setVisibility] = useState(false);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  useEffect(() => {
    const getLogo = async () => {
      try {
        await dispatch(fetchLogos()).unwrap();
      } catch (error) {
        console.error("Failed to fetch logos:", error);
      }
    };
    if (statusLogo === "idle") {
      getLogo();
    }
  }, [dispatch]);

  const handleLogin = async () => {
    try {
      const result = await dispatch(login(formData)).unwrap();
      if (result?.token) {
        setAuth(true);
        setIsAuthForm(true);
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
    <div
      className={`${isAuthForm ? "translate-x-full" : "translate-x-0"} z-50 ${
        isAuthenticated ? "w-[40vh]" : "md:w-[40vh]"
      } fixed bg-base-100 bg-gradient-to-r top-0 border-l border-base-300 right-0 h-screen overflow-y-auto duration-300 `}>
      {user && secureLocalStorage.getItem("auth_token") ? (
        <>
          <div className="pt-16">
            {user?.role === "administrator" && (
              <div className="flex w-full flex-col">
                <div className="divider">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-4 btn active:scale-95 duration-200 btn-sm bg-blue-700 text-white rounded-md hover:bg-blue-800 transition">
                    Admin Panel
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : !isRegistering ? (
        <>
          <div
            className={`p-3 mt-16 from-${theme?.name}-700/10 to-${theme?.name}-700/10 bg-gradient-to-r`}>
            <div className="form-control bg-base-100/50">
              <label
                className={`px-2 py-2 from-${theme?.name}-950/10 via-${theme?.name}-950/10 to-${theme?.name}-950/10 bg-gradient-to-r border border-base-300 flex items-center gap-2 text-[14px]`}>
                <span className="material-symbols-outlined text-[18px]">
                  mail
                </span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="grow bg-transparent w-full py-2 bg-base-100 h-full outline-none border-none text-[12px] font-medium"
                  placeholder="Alamat Email"
                  required
                />
              </label>
            </div>
            <div className="form-control bg-base-100/50 mt-2">
              <label
                className={`px-2 py-2 from-${theme?.name}-950/10 via-${theme?.name}-950/10 to-${theme?.name}-950/10 bg-gradient-to-r border border-base-300 flex items-center gap-2 text-[14px]`}>
                <span className="material-symbols-outlined text-[18px]">
                  lock
                </span>
                <input
                  type={!visibility ? "password" : "text"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="grow bg-transparent w-full py-2 bg-base-100 h-full outline-none border-none text-[12px] font-medium"
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
            <div className="flex items-center w-full gap-2 mt-4">
              <button
                onClick={() => {
                  navigate("/register");
                }}
                className={`w-full py-1 hover:bg-opacity-80 from-${theme?.name}-600 to-${theme?.name}-300 bg-gradient-to-t active:scale-95 duration-300 text-white font-medium text-sm transition-transform ease-in-out`}>
                Daftar
              </button>
              <button
                onClick={handleLogin}
                className={`w-full py-1 hover:bg-opacity-80 from-white/30 to-white/50 bg-gradient-to-t active:scale-95 duration-300 text-white font-medium text-sm transition-transform ease-in-out`}>
                Masuk
              </button>
            </div>

            <div aria-live="polite">
              {status === "loading" && <CircularLoader />}
              {status === "loading" && (
                <p className="text-yellow-500 text-center mt-2">Loading...</p>
              )}
              {status === "failed" && (
                <p className="text-red-500 text-center mt-2">
                  {error || "Login failed. Please try again."}
                </p>
              )}
              {status === "succeeded" && (
                <p className="text-green-500 text-center mt-2">
                  Logged In Successfully!
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex pt-20 justify-center mt-10 items-center gap-6">
            <div className="avatar">
              <div className="ring-primary ring-offset-base-100 w-16 rounded ring ring-offset-2">
                <img
                  src={`${process.env.REACT_APP_API}logo/images/${logo?.image}`}
                  alt="Logo"
                />
              </div>
            </div>
            <div>
              <h1 className="text-start text-xl font-medium text-yellow-500 cursor-pointer">
                {!isRegistering ? "Login" : "Register"}
              </h1>
              <h1
                onClick={() => {
                  if (isMobile && !isRegistering) {
                    navigate("/register");
                  } else {
                    setIsRegistering((prev) => !prev);
                  }
                }}
                className="text-start text-neutral-content cursor-pointer"
                role="button"
                aria-pressed={isRegistering}>
                Sudah punya akun? {isRegistering ? "Login" : "Register"}
              </h1>
            </div>
          </div>
          <RegisterForm />
        </>
      )}
    </div>
  );
};
