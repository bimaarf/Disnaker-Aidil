import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectUser } from "../../../../../../features/authentication/AuthSlice";
import { DepositModal } from "../__modalDeposit";

export const PhoneInput = ({ value, onChange, placeholder }) => {
  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, "");
    let formattedNumber = "";

    if (input.length > 0) {
      formattedNumber += "(" + input.substring(0, 3);
    }
    if (input.length >= 4) {
      formattedNumber += ") " + input.substring(3, 6);
    }
    if (input.length >= 7) {
      formattedNumber += "-" + input.substring(6, 10);
    }
    onChange(formattedNumber);
  };

  return (
    <input
      type="text"
      className="grow bg-transparent"
      value={value}
      onChange={handlePhoneChange}
      placeholder={placeholder}
    />
  );
};
export const ProfileBox = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser);

  const formatPhoneNumber = (number) => {
    if (!number) return "";
    return number.replace(/(\d{3})(\d{3})(\d+)/, "($1) $2-$3");
  };

  const formatRupiah = (amount) => {
    if (amount === undefined || amount === null) return "Rp 0";
    return "Rp " + Number(amount).toLocaleString("id-ID");
  };

  // Sync formInput state with user state

  const [modalOpen, setModalOpen] = useState(false);
  const handleDeposit = () => {
    setModalOpen(true);
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobile ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isMobile]);

  return (
    <>
      {modalOpen && <DepositModal onClose={() => setModalOpen(false)} />}
      {/* form */}
      <div className="bg-base-200 p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="input md:w-1/2 input-bordered flex items-center gap-2">
            <span className="material-symbols-outlined">mail</span>
            <p>{user?.email}</p>
          </div>
          <div className="input md:w-1/2 input-bordered flex items-center gap-2">
            <span className="material-symbols-outlined">person</span>
            <p>{user?.name}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div
            className={`input md:w-1/2 input-bordered flex items-center gap-2 ${
              isMobile && "w-full"
            }`}>
            <span className="material-symbols-outlined">phone</span>
            <div>{formatPhoneNumber(user?.phone_number)}</div>
          </div>
          <div className="input md:w-1/2 input-bordered flex items-center gap-2">
            <span className="material-symbols-outlined">key</span>
            <p>{user?.role}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div className="input md:w-1/2 input-bordered flex items-center gap-2">
            <span className="material-symbols-outlined">calendar_month</span>
            <p>{user?.registered}</p>
          </div>
          <div className="input md:w-1/2 input-bordered flex justify-between items-center">
            <span className="material-symbols-outlined">payments</span>
            <p className="font-bold text-warning text">
              {formatRupiah(user?.wallet?.balance)}
            </p>{" "}
            <button
              onClick={() => {
                if (isMobile) {
                  navigate("/deposit/request");
                } else {
                  handleDeposit(); // Call the correct function to open modal
                }
              }}
              className="flex items-center gap-2 text-sm bg-base-200 hover:bg-base-300 rounded px-2 py-1.5">
              <span className="material-symbols-outlined">add_circle</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
