import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "./__logo";
// import CheckoutActivityChart from "../../__checkout/_checkoutActivityChart";
export const Tabs = ({ user }) => {
  const [activeTab, setActiveTab] = useState(1);
  const navigate = useNavigate();

  // const [AlertAccountMessages] = useState({
  //   status: user?.status,
  //   title: user?.status
  //     ? "You are already logged in!"
  //     : "Your account has been suspended, contact the administrator!",
  // });

  return (
    <div className="w-full h-full rounded-lg shadow-md">
      <div className="px-4">
        <nav
          className="flex gap-x-2"
          aria-label="Tabs"
          role="tablist"
          aria-orientation="horizontal">
          <button
            type="button"
            className={`py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap ${
              activeTab === 1
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => {
              setActiveTab(1);
              navigate("/dashboard?query=overflow");
            }}
            id="basic-tabs-item-1"
            aria-selected={activeTab === 1}
            aria-controls="basic-tabs-1"
            role="tab">
            Overflow
          </button>

          <button
            type="button"
            className={`py-4 px-1 inline-flex items-center gap-x-2 border-b-2 text-sm whitespace-nowrap ${
              activeTab === 3
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => {
              setActiveTab(3);
              navigate("/dashboard?query=logo");
            }}
            id="basic-tabs-item-3"
            aria-selected={activeTab === 3}
            aria-controls="basic-tabs-3"
            role="tab">
            Logo
          </button>
          <button
            type="button"
            className={`py-4 px-1 flex items-center border-b-2 text-sm whitespace-nowrap ${
              activeTab === 4
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => {
              setActiveTab(4);
              navigate(`/users/account?email=${user?.email}`);
            }}
            id="basic-tabs-item-4"
            aria-selected={activeTab === 4}
            aria-controls="basic-tabs-4"
            role="tab">
            Account
          </button>
        </nav>
      </div>

      <div className="mt-3 p-4">
        {/* {user?.status ? (
          <AlertSuccess messages={AlertAccountMessages} />
        ) : (
          <AlertWarning messages={AlertAccountMessages} />
        )} */}
        {activeTab === 1 && (
          <>
            <div
              id="basic-tabs-1"
              role="tabpanel"
              aria-labelledby="basic-tabs-item-1">
              {/* <div className="mt-4 w-full">
                <CheckoutActivityChart />
              </div> */}
              {/* <div className="mt-4 w-full">
                <UserRegistrationActivity />
              </div>
              <div className="mt-4 w-full">
                <RespondentPerDayChart />
              </div> */}
            </div>
          </>
        )}

        {activeTab === 2 && (
          <div
            id="basic-tabs-3"
            role="tabpanel"
            aria-labelledby="basic-tabs-item-3">
            <Logo user={user} />
          </div>
        )}
      </div>
    </div>
  );
};
