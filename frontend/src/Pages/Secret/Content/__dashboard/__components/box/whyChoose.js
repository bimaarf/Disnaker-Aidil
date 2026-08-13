import { BarChart3, BookOpen, CheckSquare, Monitor } from "lucide-react";
import React from "react";

export const WhyChoose = () => {
  const features = [
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "E-Learning Platform",
      description: "Interactive online classes with multimedia content",
      gradient: "from-purple-500/10 to-blue-500/10",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-600",
    },
    {
      icon: <CheckSquare className="w-8 h-8" />,
      title: "Smart Attendance",
      description: "Automatic attendance tracking and participation monitoring",
      gradient: "from-pink-500/10 to-purple-500/10",
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-600",
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Complete Materials",
      description: "Comprehensive learning materials with practice exercises",
      gradient: "from-purple-500/10 to-purple-500/10",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-600",
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: "Progress Monitoring",
      description: "Real-time tracking of your English learning progress",
      gradient: "from-blue-500/10 to-indigo-500/10",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-600",
    },
  ];
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`text-center p-6 lg:p-8 bg-gradient-to-br ${feature.gradient} rounded-2xl hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group`}>
            <div
              className={`inline-flex items-center justify-center w-16 h-16 ${feature.iconBg} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
              <div className={feature.iconColor}>{feature.icon}</div>
            </div>
            <h3 className="text-xl font-semibold text-base-content mb-3">
              {feature.title}
            </h3>
            <p className="text-base-content/80 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};
