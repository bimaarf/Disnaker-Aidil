import React from "react";
import { TECarousel, TECarouselItem } from "tw-elements-react";

export const Carousel = () => {
  return (
    <>
      <TECarousel ride="carousel">
        <div className="relative w-full overflow-hidden after:clear-both after:block after:content-['']">
          {(function (rows, i, len) {
            while (++i <= len) {
              rows.push(
                <TECarouselItem
                  key={i}
                  itemID={i}
                  className="relative float-left -mr-[100%] hidden w-full transition-transform duration-[600ms] ease-in-out motion-reduce:transition-none">
                  <img
                    draggable={false}
                    src={require(`../Images/Banner/banner-${i}.jpeg`)}
                    className="block w-full"
                    alt="..."
                  />
                </TECarouselItem>
              );
            }
            return rows;
          })([], 0, 10)}
        </div>
      </TECarousel>
    </>
  );
};
