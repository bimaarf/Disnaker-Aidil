import React, { useEffect, useState } from "react";
import "./Activity.css"; // Import CSS for animation

export const Activity = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const initialData = generateRandomActivities(500);
    setData(initialData);

    const interval = setInterval(() => {
      const newActivity = generateRandomActivity();
      setData((prevData) => [newActivity, ...prevData]); // Add new activity at the top
    }, 2000); // Generates new data every 2 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  const generateRandomActivities = (count) => {
    const activities = [];
    for (let i = 0; i < count; i++) {
      activities.push(generateRandomActivity());
    }
    return activities;
  };

  const generateRandomActivity = () => {
    const emails = [
      "stvxxxx@gmail.com",
      "rndxxxxx@gmail.com",
      "budxxxxx@gmail.com",
      "alicexxx@example.com",
      // Add more emails as needed
    ];
    const labels = [
      "New Registered",
      "New Deposit",
      "Withdrawal Made",
      "Winner",
    ];

    const randomEmail = emails[Math.floor(Math.random() * emails.length)];
    const randomLabel = labels[Math.floor(Math.random() * labels.length)];
    const icon = getIconForLabel(randomLabel); // Get the icon based on the label

    const currentDateTime = new Date().toLocaleString(); // Current date and time

    return {
      email: randomEmail,
      label: randomLabel,
      dateTime: currentDateTime,
      icon: icon,
    };
  };

  const getIconForLabel = (label) => {
    switch (label) {
      case "New Registered":
        return "person_add";
      case "New Deposit":
        return "payments";
      case "Withdrawal Made":
        return "money_off";
      case "Winner":
        return "trophy";
      default:
        return "help";
    }
  };

  return (
    <>
      <div className="divider divider-primary">Activity</div>
      <div className="h-96 overflow-y-scroll overflow-x-hidden space-y-2 md:pr-4 activity-container">
        {data.map((item, key) => (
          <div
            key={key}
            className={`activity-item ${key === 0 ? "roll" : ""}`} // Apply animation only to the top item
          >
            <div className="flex bg-gradient-to-b from-base-300 to-base-100 hover:from-base-100 cursor-pointer active:ml-2 duration-200 p-3 w-full rounded-3xl">
              <div className="flex justify-start items-center gap-3">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content w-12 rounded-full">
                    <span>{item.email.split("@")[0].slice(0, 2)}</span>
                  </div>
                </div>
                <div className="flex-col">
                  <p className="font-bold">{item.email}</p>
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
          </div>
        ))}
      </div>
    </>
  );
};
