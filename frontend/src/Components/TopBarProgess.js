import React from "react";
import NProgress from "nprogress"; // Import NProgress
import "../index.css"; // Import the default styles for NProgress

// Set the configuration for NProgress
NProgress.configure({
  showSpinner: false, // Hide the spinner if desired
  trickleSpeed: 200, // Speed of the trickle effect
  minimum: 0.1, // Minimum percentage of the progress bar
  easing: "ease", // Animation easing
  speed: 500, // Animation speed
  parent: "body", // Set the parent element for the progress bar
});

export const TopBarProgress = ({ onFinish }) => {
  React.useEffect(() => {
    NProgress.start(); // Start the progress bar

    // Simulate an animation delay
    NProgress.done(); // Finish the progress bar
    if (onFinish) onFinish(); // Notify parent when done

    return () => {
      NProgress.done(); // Ensure NProgress is completed on unmount
    };
  }, [onFinish]);

  return null; // This component doesn't render anything visible
};
