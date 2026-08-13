import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useIsMobile from "../../../../../Context/__useIsMobile";
import { createNotification } from "../../../../../features/notifications/notificationSlice";
import RupiahInput from "../../../Components/rupiahInput";
import { ProfileBox } from "../../__dashboard/__components/__profile/other/__profileBox";
import { ProfileHeader } from "../../__dashboard/__components/__profile/other/__profileHeader";

export const ModalWinner = ({ dataWinner, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef();
  const [amount, setAmount] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    setIsVisible(true);
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = "15px";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!amount) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const storeData = {
      amount: parseInt(amount.replace(/[^0-9]/g, "")),
      user_id: dataWinner.id,
    };

    dispatch(createNotification(storeData))
      .unwrap()
      .then(() => {
        toast.success("Winner created successfully.");
        setAmount("");
        handleClose();
      })
      .catch(() => toast.error("Failed to create winner."));
  };
  return (
    <div
      role="dialog"
      aria-modal="true"
      id="modal-winner"
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md transition-all duration-300"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div
        style={{
          height: "90%",
          maxWidth: !isMobile ? "calc(100% - 288px)" : "100%",
          boxSizing: "border-box",
        }}
        ref={modalRef}
        className={`overflow-y-auto w-11/12 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 transform transition-transform duration-300 ease-in-out ${
          isVisible ? "translate-y-0" : "translate-y-full"
        }`}>
        <ProfileHeader data={dataWinner} />
        <ProfileBox data={dataWinner} />
        <div className="divider text-neutral mt-20">
          <span className={`text-warning text-4xl material-symbols-outlined`}>
            trophy
          </span>
        </div>

        <div className="divider w-full flex justify-center text-neutral mt-20">
          <div className="flex justify-center w-full items-center gap-2">
            <span
              className={`text-base-300 ${
                isMobile && "hidden"
              } material-symbols-outlined`}>
              switch_access_shortcut
            </span>

            <RupiahInput
              initialValue={amount}
              onChange={(value) => setAmount(value)}
            />
            <span
              className={`text-base-300 rotate-180 ${
                isMobile && "hidden"
              } material-symbols-outlined`}>
              switch_access_shortcut
            </span>
          </div>
        </div>

        <div className="flex justify-end items-end mt-10 gap-4 w-full">
          <button
            onClick={handleSubmit}
            type="submit"
            className="py-4 bg-red-700 active:scale-95 duration-200 hover:brightness-95 w-80 rounded">
            Add To Winner Board
          </button>
          <button
            onClick={handleClose}
            className="py-4 bg-base-200 active:scale-95 duration-200 hover:brightness-95 w-32 rounded">
            Close
          </button>
        </div>
        <button
          onClick={() =>
            navigate(`/users/account?email=${dataWinner.email}`, {
              state: { dataWinner },
            })
          }
          className="py-4 bg-info-700 mt-4 active:scale-95 duration-200 hover:brightness-95 w-80 rounded">
          Preview Account
        </button>
      </div>
    </div>
  );
};
