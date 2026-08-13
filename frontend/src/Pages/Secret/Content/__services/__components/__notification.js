import React from "react";

export const Notification = () => {
  const data = [
    {
      username: "Jokowi Dodo",
      label: "New Registered",

      dateTime: "24-09-2024 14:22",
      icon: "person_add",
    },
    {
      username: "Prabowo Subianto",
      label: "New Deposit",

      dateTime: "24-09-2024 14:22",
      icon: "payments",
    },
    {
      username: "Jokowi Dodo",
      label: "New Registered",

      dateTime: "24-09-2024 14:22",
      icon: "person_add",
    },
    {
      username: "Prabowo Subianto",
      label: "New Deposit",

      dateTime: "24-09-2024 14:22",
      icon: "payments",
    },
    {
      username: "Megawati",
      label: "New Deposit",

      dateTime: "24-09-2024 14:22",
      icon: "payments",
    },
    {
      username: "Jokowi Dodo",
      label: "New Registered",

      dateTime: "24-09-2024 14:22",
      icon: "person_add",
    },
    {
      username: "Prabowo Subianto",
      label: "New Deposit",

      dateTime: "24-09-2024 14:22",
      icon: "payments",
    },
  ];
  return (
    <>
      <div className="divider divider-primary">Notification</div>
      <div className="h-96 overflow-y-scroll overflow-x-hidden space-y-2 md:pr-4">
        {data.map((item, key) => (
          <div
            key={key}
            className="flex bg-gradient-to-b from-base-300 to-base-100 hover:from-base-100 cursor-pointer active:ml-2 duration-200 p-3 w-full rounded-3xl justify-between">
            <div className="flex justify-start items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content w-12 rounded-full">
                  <span>
                    {item.username.split(" ")[0].slice()[0]}
                    {item.username.split(" ")[1]?.slice()[0]}
                  </span>
                </div>
              </div>
              <div className="flex-col">
                <p className="font-bold">{item.username}</p>
                <p className="text-neutral">{item.label}</p>
              </div>
            </div>
            <div className="flex justify-end items-center gap-4">
              <div className="badge badge-neutral text-xs rounded-full text-base-content">
                {item.dateTime}
              </div>
              <span className="material-symbols-outlined">{item.icon}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
