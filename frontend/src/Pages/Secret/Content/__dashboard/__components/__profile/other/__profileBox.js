import React, { useEffect, useState } from "react";

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

export const ProfileBox = ({ data }) => {
  const formatPhoneNumber = (number) => {
    if (!number) return "";
    return number.replace(/(\d{3})(\d{3})(\d+)/, "($1) $2-$3");
  };

  const formatRupiah = (amount) => {
    if (amount === undefined || amount === null) return "Rp 0";
    return "Rp " + Number(amount).toLocaleString("id-ID");
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
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
      {/* form */}
      <div className="bg-base-200 p-4 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div
            className={`input md:w-1/2 input-bordered flex items-center gap-2 ${
              isMobile && "w-full"
            }`}>
            <span className="material-symbols-outlined">mail</span>
            <p>{data?.email}</p>
          </div>
          <div
            className={`input md:w-1/2 input-bordered flex items-center gap-2 ${
              isMobile && "w-full"
            }`}>
            <span className="material-symbols-outlined">person</span>
            <p>{data?.name}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:gap-4">
          <div
            className={`input md:w-1/2 input-bordered flex items-center gap-2 ${
              isMobile && "w-full"
            }`}>
            <span className="material-symbols-outlined">phone</span>
            <div>{formatPhoneNumber(data?.phone_number)}</div>
          </div>
          <div
            className={`input md:w-1/2 input-bordered flex items-center gap-2 ${
              isMobile && "w-full"
            }`}>
            <span className="material-symbols-outlined">key</span>
            <p>{data?.roles}</p>
          </div>
        </div>
        <div className="flex items-center flex-col gap-3 md:flex-row md:gap-4">
          <div
            className={`input md:w-1/2 input-bordered flex items-center gap-2 ${
              isMobile && "w-full"
            }`}>
            <span className="material-symbols-outlined">calendar_month</span>
            <p>{data?.created_at}</p>
          </div>
          <div
            className={`input md:w-1/2 input-bordered flex items-center gap-2 ${
              isMobile && "w-full"
            }`}>
            <span className="material-symbols-outlined">payments</span>
            <p className="font-bold text-warning text">
              {formatRupiah(data?.wallet?.balance)} (other)
            </p>{" "}
          </div>
        </div>
      </div>
    </>
  );
};
