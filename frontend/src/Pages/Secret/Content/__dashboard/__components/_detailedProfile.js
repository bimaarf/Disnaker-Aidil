import React, { useState, memo, useEffect } from "react";
import { useSelector } from "react-redux";
import { selectUser } from "../../../../../features/authentication/AuthSlice";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Clock,
  Settings,
  EyeOff,
  Globe,
  Smartphone,
  MonitorCog,
} from "lucide-react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import { formatPhoneNumber } from "../../../Components/phoneNumberInput";
import { formatDateMonthYear } from "../../../../../Context/__formatDate";
import { Logo } from "../../__dashboard/__components/__logo";
const DetailedProfile = () => {
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState("overview");
  useEffect(() => {
    console.debug(user);
  }, [user]);
  const isActive = user?.status === 1 || user?.status === "1";
  const tabs = [
    { id: "overview", label: "Overview", icon: <User className="w-4 h-4" /> },
    {
      id: "logo",
      label: "Logo",
      icon: <MonitorCog className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  // const SettingButton = ({ icon, label, value, url = null }) => {
  //   return (
  //     <div
  //       onClick={() => navigate(url)}
  //       className="flex items-center justify-between p-4 bg-base-200 rounded-xl border hover:bg-base-300/50 border-base-300 transition-colors duration-200"
  //       data-tooltip-id={`tooltip-${label}`} // ID tooltip unik per field
  //       data-tooltip-content={value || "Not provided"} // Konten tooltip
  //     >
  //       <div className="flex items-center gap-3 flex-1 min-w-0">
  //         <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-blue-600">
  //           {icon}
  //         </div>
  //         <div className="flex-1 min-w-0">
  //           <p className="text-sm font-medium text-base-content">{label}</p>
  //           <p className="text-[12px] font-semibold text-base-content/60 truncate">
  //             {value || "Not provided"}
  //           </p>
  //         </div>
  //       </div>
  //       {/* {sensitive && (
  //         <button className="ml-2 p-2 rounded-lg hover:bg-gray-200 transition-colors">
  //           <EyeOff className="w-4 h-4" />
  //         </button>
  //       )} */}

  //       {/* Tooltip */}
  //       <Tooltip id={`tooltip-${label}`} />
  //     </div>
  //   );
  // };
  const ProfileField = ({ icon, label, value, sensitive = false }) => {
    return (
      <div
        className="flex items-center justify-between p-4 bg-base-200 rounded-xl border hover:bg-base-300/50 border-base-300 transition-colors duration-200"
        data-tooltip-id={`tooltip-${label}`} // ID tooltip unik per field
        data-tooltip-content={value || "Not provided"} // Konten tooltip
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-blue-600">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-base-content">{label}</p>
            <p className="text-[12px] font-semibold text-base-content/60 truncate">
              {value || "Not provided"}
            </p>
          </div>
        </div>
        {sensitive && (
          <button className="ml-2 p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <EyeOff className="w-4 h-4" />
          </button>
        )}

        {/* Tooltip */}
        <Tooltip id={`tooltip-${label}`} />
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 backdrop-blur-sm overflow-hidden">
        <div className="flex border-b border-base-300">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}>
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ProfileField
                  icon={<User />}
                  label="Full Name"
                  value={user?.name}
                  isEditable={true}
                  field="name"
                />
                <ProfileField
                  icon={<Mail />}
                  label="Email"
                  value={user?.email}
                  isEditable={true}
                  field="email"
                  type="email"
                />
                <ProfileField
                  icon={<Phone />}
                  label="Phone Number"
                  value={formatPhoneNumber(user?.phone_number)}
                  isEditable={true}
                  field="phone_number"
                  type="tel"
                />
                <ProfileField
                  icon={<Smartphone />}
                  label="Device"
                  value={
                    user?.device
                      ? `${user.device.platform}/browser ${user.device.browser}-${user.device.browser_version}`
                      : "-"
                  }
                />

                <ProfileField
                  icon={<Globe />}
                  label="Role"
                  value={user?.role}
                />
                <ProfileField
                  icon={<Shield />}
                  label="Status"
                  value={isActive ? "Active" : "Suspended"}
                />

                <ProfileField
                  icon={<Calendar />}
                  label="Joined Date"
                  value={formatDateMonthYear(user?.created_at)}
                />
                <ProfileField
                  icon={<Clock />}
                  label="Last Login"
                  value={user?.last_online_at}
                />
              </div>
            </div>
          )}

          {activeTab === "logo" && (
            <div className="Logo-y-6">
              <h2 className="text-xl font-bold text-base-content">
                Logo Setting
              </h2>
              <Logo />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-base-content">
                Account Settings
              </h2>
              <div className="space-y-4">
                {/* {user?.role !== "user" && (
                  <SettingButton
                    icon={<WhatsApp />}
                    label="Whatsapp Setting"
                    value={user?.language || "Template"}
                    url={"/settings/whatsapp-template"}
                  />
                )} */}
                <ProfileField
                  icon={<Globe />}
                  label="Timezone"
                  value={user?.timezone || "Asia/Jakarta"}
                />
                {/* Add more settings fields or forms as needed */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(DetailedProfile);
