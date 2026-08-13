import { BookOpen, Globe, Users } from "lucide-react";
import React from "react";

export const WhyChooseEnggang = () => {
  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Empowerment",
      description: "Uplifting lives through impactful community programs",
      gradient: "from-blue-500/10 to-indigo-500/10",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-600",
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Educational Programs",
      description: "Brightening futures with accessible learning opportunities",
      gradient: "from-pink-500/10 to-purple-500/10",
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-600",
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Global Outreach",
      description: "Inspiring change through worldwide initiatives",
      gradient: "from-purple-500/10 to-violet-500/10",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="py-10 sm:py-14 lg:py-20">
      {/* Section Header */}
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-3">
          Why Choose{" "}
          <span className="text-indigo-600">Enggang Foundation?</span>
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base lg:text-lg">
          Discover how we empower communities through education, development,
          and global initiatives
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`text-center p-6 lg:p-8 bg-white shadow-lg rounded-2xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group bg-gradient-to-br ${feature.gradient}`}>
            <div
              className={`inline-flex items-center justify-center w-16 h-16 ${feature.iconBg} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
              <div className={feature.iconColor}>{feature.icon}</div>
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
