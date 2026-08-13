import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularLoader } from "../../../../Components/_CircularLoader";
import { rupiahFormat } from "../../../../Context/__rupiahFormat";
import useIsMobile from "../../../../Context/__useIsMobile";
import { selectUser } from "../../../../features/authentication/AuthSlice";
import { fetchWithdraw } from "../../../../features/withdraws/withdrawSlice";
import { WithdrawApproveButton } from "./__app/___withdrawApprove";
import { WithdrawFileUpload } from "./__app/___withdrawFileUpload";
import { WithdrawRejectButton } from "./__app/___withdrawReject";

export const WithdrawPreviewPage = () => {
  const { key, dataProps } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (dataProps) {
          setData(JSON.parse(dataProps));
        } else if (key) {
          const withdrawData = await dispatch(fetchWithdraw(key)).unwrap();
          setData(withdrawData);
        }
      } catch (error) {
        toast.error("Failed to fetch withdraw data?.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, key, dataProps]);

  const isMobile = useIsMobile();

  const handleImageUploadSuccess = (newImage) => {
    setData((prevData) => ({
      ...prevData,
      image: newImage,
    }));
  };

  const handleStatusUpdate = (newStatus) => {
    setData((prevData) => ({
      ...prevData,
      status: newStatus,
    }));
  };
  if (!data) {
    return <p>No information available</p>;
  }
  return (
    <div className="flex flex-col px-1 mt-4 md:flex-row justify-between items-start gap-4">
      {loading && <CircularLoader />}

      <div className="relative w-full">
        <div className="w-full transition-all duration-300 ease-in-out">
          <div className="from-base-300 to-base-100 bg-gradient-to-t rounded-b-xl pb-10">
            <div className="w-full font-medium font-mono text-xl bg-warning-600 uppercase p-3">
              <span>INVOICE#</span>
              <span className="text-primary-content underline">{key}</span>
            </div>
            <div className="p-4 text-center">
              <h1 className="font-medium text-2xl">Withdrawal Process</h1>
            </div>
            <div className="flex justify-center items-center gap-2">
              <span className="material-symbols-outlined md:text-5xl">
                payments
              </span>
              <h1
                className={`text-center font-medium ${
                  isMobile ? "text-xl" : "text-4xl"
                }`}>
                {data?.amount
                  ? rupiahFormat(data?.amount)
                  : "Loading amount..."}
              </h1>
            </div>
            <div className="flex justify-center mt-4">
              <ul
                className={`steps w-full ${isMobile ? "text-xs" : "text-md"}`}>
                <li className="step step-success">Transaction Process</li>
                <li className={`step ${data?.status ? "step-success" : ""}`}>
                  Approved
                </li>
              </ul>
            </div>
            <div className="mt-4 flex justify-between">
              <div className="-mt-5 -ml-4 float-left">
                <i className="fas fa-circle left-0 text-4xl text-base-100"></i>
              </div>
              <div className="border-t border-base-300 border-dashed w-full"></div>
              <div className="-mt-5 -mr-4">
                <i className="fas fa-circle left-0 text-4xl text-base-100"></i>
              </div>
            </div>
            <div className="md:flex justify-between p-4">
              <div className="md:w-1/2 mx-auto">
                <div className="divider">Wallet</div>
                <div className="text-center gap-4 flex justify-center items-center">
                  <div className="flex justify-center">
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded w-full size-20">
                        <span className="material-symbols-outlined text-3xl">
                          wallet
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-start">
                    <h1 className="font-medium">{data?.account_name}</h1>
                    <p className="font-medium">{data?.account_number}</p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 mx-auto">
                <div className="divider">Bukti Pembayaran</div>
                <div className="flex justify-center">
                  {data?.image ? (
                    <img
                      className="size-20 w-full object-contain rounded"
                      src={`${process.env.REACT_APP_API}withdraw/images/${data?.image}`}
                      alt=""
                    />
                  ) : (
                    <div className="avatar placeholder">
                      <div className="bg-neutral text-neutral-content rounded w-full size-20">
                        <span className="material-symbols-outlined text-3xl">
                          upload
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:w-2/3 mx-auto">
        <div className="w-full">
          <div className="divider">Bukti Pembayaran</div>
          <WithdrawFileUpload
            selectedData={data}
            onUploadSuccess={handleImageUploadSuccess}
          />
          <div className="divider">Actions</div>
          {user.role === "administrator" || user.role === "Super Admin" ? (
            <div className="flex items-center gap-2">
              <WithdrawApproveButton
                selectedData={data}
                handleApproveSuccess={(walletKey) =>
                  handleStatusUpdate(1, walletKey)
                }
              />
              <WithdrawRejectButton
                selectedData={data}
                handleRejectSuccess={(walletKey) =>
                  handleStatusUpdate(0, walletKey)
                }
              />
            </div>
          ) : (
            ""
          )}
        </div>
      </div>
    </div>
  );
};
