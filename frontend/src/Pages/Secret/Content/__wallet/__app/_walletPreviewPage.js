import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { CircularLoader } from "../../../../../Components/_CircularLoader";
import { rupiahFormat } from "../../../../../Context/__rupiahFormat";
import { fetchWallet } from "../../../../../features/wallets/walletSlice";
import { BoxMenuWallet } from "../__components/__boxMenuWallet";

export const WalletPreviewPage = () => {
  const { key } = useParams();
  const location = useLocation();
  const dataProps = location.state?.dataProps;
  const [data, setData] = useState(dataProps);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        if (!dataProps || !key || dataProps.key !== key) {
          const walletData = await dispatch(fetchWallet(key)).unwrap();
          setData(walletData);
        }
      } catch (error) {
        toast.error("Failed to fetch wallet data.");
        navigate("/wallets"); // Kembali ke daftar dompet jika gagal
      } finally {
        setLoading(false);
      }
    };

    if (key) {
      fetchData();
    } else {
      setLoading(false); // Set loading to false if no key is present
    }
  }, [dispatch, key, dataProps, navigate]);

  // Menangani keadaan jika data belum ada
  if (loading) {
    return <CircularLoader />;
  }

  if (!data) {
    return <p>No information available</p>;
  }

  return (
    <div className="flex overflow-x-hidden max-w-screen-xl flex-col px-1 mt-4 md:flex-row justify-between items-start gap-4">
      <div className="relative w-full">
        <div className="flex justify-start items-center overflow-x-auto gap-4 mb-4">
          <button
            onClick={() => navigate("/wallets")}
            className={`flex items-center gap-1 px-4 py-2 text-sm bg-base-100 hover:bg-base-200 rounded active:scale-95 duration-100`}>
            <span className="material-symbols-outlined">
              arrow_back_ios_new
            </span>
            <span>Wallets</span>
          </button>
        </div>

        <div className="w-full transition-all duration-300 ease-in-out">
          <div className="from-base-300 to-base-100 bg-gradient-to-t rounded-b-xl pb-10">
            <div className="w-full flex items-center gap-1 font-medium font-mono text-xl bg-primary uppercase p-3">
              <span className="material-symbols-outlined">wallet</span>
              <span className="text-primary-content underline">
                {data?.account_name}
              </span>
            </div>
            <div className="p-4 text-center">
              <h1 className="font-medium text-xl">Your Balance</h1>
            </div>
            <div className="flex justify-center items-center gap-2">
              <span className="material-symbols-outlined text-[42px]">
                payments
              </span>
              <p className={`text-center font-medium text-[32px]`}>
                {rupiahFormat(data?.balance)}
              </p>
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
            <BoxMenuWallet data={data} />
            <div className="md:flex justify-between p-4">
              <div className="md:w-1/2 mx-auto">
                <div className="divider w-full">
                  {data?.status ? "Actived" : "Suspended"}
                </div>
                <div className="text-center gap-4 flex w-full bg-base-200/50 p-2 justify-around items-center">
                  <div className="flex justify-center w-fit">
                    <div className="avatar placeholder">
                      <div className="text-neutral-content p-2 rounded w-full">
                        <span
                          className={`${
                            data?.status ? "text-success" : "text-error"
                          } material-symbols-outlined text-6xl`}>
                          {data?.status ? "check" : "close"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-start rounded">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        wallet
                      </span>
                      <h1 className="">{data?.account_name || "-"}</h1>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        content_paste
                      </span>
                      <p className="">{data?.account_number || "-"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">
                        call
                      </span>
                      <p className="">{data?.phone_number || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
