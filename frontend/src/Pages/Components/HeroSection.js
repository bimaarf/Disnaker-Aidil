import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { selectLandingByRouteName } from "../../features/LandingPages/routesHook";
import { DynamicLucideIcon } from "../../Helper/dinamycLucideIcon";

export const HeroSection = ({ landingProps = "home" }) => {
  const heroRef = useRef(null);
  const { logos: logo } = useSelector((state) => state.logos);
  const landing = useSelector(selectLandingByRouteName(landingProps));

  const useIntersectionObserver = (ref, threshold = 0.1) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => setIsVisible(entry.isIntersecting));
        },
        { threshold }
      );

      if (ref.current) {
        observer.observe(ref.current);
      }

      return () => observer.disconnect();
    }, [ref, threshold]);

    return isVisible;
  };
  const isHeroVisible = useIntersectionObserver(heroRef);

  // const heroBackgroundStyle = logo?.background_header
  //   ? {
  //       backgroundImage: `url(${logo.background_header})`,
  //       backgroundSize: "cover",
  //       backgroundPosition: "top center",
  //       backgroundRepeat: "no-repeat",
  //     }
  //   : {};
  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-[#1F1F1F] text-white">
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat opacity-70"
        style={{
          backgroundImage: logo?.background_header
            ? `url(${logo.background_header})`
            : "none",
          transform: `translateY(${scrollY * 0.3}px)`,
          willChange: "transform",
        }}
      />

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/50 via-black/60 to-black/70" />

      <div className="relative h-[300px] md:h-[300px]">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-4xl">
            <div
              className={`inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg text-xs font-semibold border border-white/20 transition-all duration-1000 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}>
              <DynamicLucideIcon
                iconName={landing?.icon || ""}
                className="w-4 h-4"
              />
              <span>{landing?.title}</span>
            </div>

            <h1
              className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight transition-all duration-1000 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "200ms" }}>
              {landing?.title || ""}
            </h1>

            {landing?.subtitle && (
              <h2
                className={`text-xl sm:text-2xl lg:text-3xl font-semibold text-red-500 mb-4 transition-all duration-1000 ${
                  isHeroVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: "400ms" }}>
                {landing.subtitle}
              </h2>
            )}

            <p
              className={`text-sm sm:text-base text-gray-300 leading-relaxed max-w-3xl transition-all duration-1000 ${
                isHeroVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: "600ms" }}>
              {landing?.description || ""}
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </section>
  );
};
