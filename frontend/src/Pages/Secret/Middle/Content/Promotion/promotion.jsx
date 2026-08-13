import React from "react";
// import { useSelector } from "react-redux";
export const Promotion = ({ filteredPromotion }) => {
  // const theme = useSelector((state) => state.themes.theme);
  return (
    <div className={`bg-base-100/50 md:p-4 overflow-x-hidden`}>
      {filteredPromotion.length > 0 ? (
        filteredPromotion.map((item, index) => (
          <div key={index} className="mb-4 space-y-4">
            {item.content.map((promo, idx) => (
              <div
                key={idx}
                className="bg-base-100/10 rounded-md shadow-md text-white">
                <img
                  src={promo.image}
                  alt={promo.title}
                  className="w-full h-full object-cover rounded-md mb-2"
                />
                <h4 className="font-bold">{promo.title}</h4>
                <p className="text-sm">{promo.body}</p>
                <p className="text-xs text-gray-400">
                  Last Date: {promo.lastDate}
                </p>
              </div>
            ))}
          </div>
        ))
      ) : (
        <p>No promotions found.</p> // Handle case where no promotions match the filter
      )}
    </div>
  );
};
