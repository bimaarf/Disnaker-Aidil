import React, { useEffect, useState, useCallback } from "react";
import { MessageCircle, X, Users } from "lucide-react";

const ChatCustomeLiveChat = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [isLiveChatReady, setIsLiveChatReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAgentOnline, setIsAgentOnline] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState(null);

  // Initialize mobile detection
  useEffect(() => {
    const checkIsMobile = () => window.innerWidth <= 768;
    setIsMobile(checkIsMobile());

    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Enhanced function to hide LiveChat widget - more aggressive approach
  const forceHideLiveChatWidget = useCallback(() => {
    // Method 1: Hide via display none
    const hideElements = () => {
      const selectors = [
        "#livechat-compact-container",
        "#livechat-full",
        '[data-lc="widget"]',
        ".livechat-widget",
        ".lc-widget",
        '[class*="livechat"]',
        '[id*="livechat"]',
      ];

      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element) => {
          element.style.display = "none !important";
          element.style.visibility = "hidden !important";
          element.style.opacity = "0 !important";
          element.style.pointerEvents = "none !important";
          element.style.position = "absolute !important";
          element.style.left = "-9999px !important";
          element.style.top = "-9999px !important";
        });
      });
    };

    // Method 2: Add CSS rules to override
    const addHidingStyles = () => {
      let style = document.getElementById("livechat-hide-styles");
      if (!style) {
        style = document.createElement("style");
        style.id = "livechat-hide-styles";
        document.head.appendChild(style);
      }

      style.textContent = `
        #livechat-compact-container,
        #livechat-full,
        [data-lc="widget"],
        .livechat-widget,
        .lc-widget,
        [class*="livechat"],
        [id*="livechat"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          position: absolute !important;
          left: -9999px !important;
          top: -9999px !important;
          width: 0 !important;
          height: 0 !important;
          z-index: -1 !important;
        }
        
        /* More specific selectors for LiveChat elements */
        iframe[src*="livechatinc.com"],
        iframe[title*="LiveChat"],
        iframe[name*="livechat"],
        div[data-testid*="livechat"],
        div[aria-label*="LiveChat"],
        button[aria-label*="LiveChat"] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      `;
    };

    // Method 3: Use MutationObserver to watch for new LiveChat elements
    const observeAndHide = () => {
      if (window.liveChatObserver) {
        window.liveChatObserver.disconnect();
      }

      window.liveChatObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if the added node is a LiveChat element
                if (
                  node.id &&
                  (node.id.includes("livechat") || node.id.includes("lc-"))
                ) {
                  node.style.display = "none !important";
                }

                // Check descendants
                const liveChatElements =
                  node.querySelectorAll &&
                  node.querySelectorAll(
                    '[id*="livechat"], [class*="livechat"], [data-lc], iframe[src*="livechatinc.com"]'
                  );
                if (liveChatElements) {
                  liveChatElements.forEach((el) => {
                    el.style.display = "none !important";
                    el.style.visibility = "hidden !important";
                  });
                }
              }
            });
          }
        });
      });

      window.liveChatObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    if (isMobile) {
      hideElements();
      addHidingStyles();
      observeAndHide();
    }
  }, [isMobile]);

  // Enhanced LiveChat hiding on mobile
  useEffect(() => {
    if (isMobile) {
      // Initial hide
      forceHideLiveChatWidget();

      // Repeat hiding with intervals to catch late-loading elements
      const intervals = [100, 500, 1000, 2000, 5000];
      const timeouts = intervals.map((delay) =>
        setTimeout(forceHideLiveChatWidget, delay)
      );

      return () => {
        timeouts.forEach((timeout) => clearTimeout(timeout));
        if (window.liveChatObserver) {
          window.liveChatObserver.disconnect();
        }
      };
    }
  }, [isMobile, forceHideLiveChatWidget]);

  // Simulate message count updates (replace with real LiveChat integration)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!chatOpen && Math.random() > 0.8) {
        setUnreadCount((prev) => prev + 1);
        setLastMessageTime(new Date());
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [chatOpen]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
    }
  }, [chatOpen]);

  // Simulate typing indicator
  useEffect(() => {
    if (!chatOpen) return;

    const typingInterval = setInterval(() => {
      if (Math.random() > 0.9) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 2000);
      }
    }, 8000);

    return () => clearInterval(typingInterval);
  }, [chatOpen]);

  // Enhanced LiveChat detection and initialization
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30;

    const initLiveChat = () => {
      attempts++;

      if (window.LiveChatWidget) {
        try {
          window.LiveChatWidget.on("ready", () => {
            setIsLiveChatReady(true);
            console.log("LiveChat ready from React component");

            // Force hide again when ready
            if (isMobile) {
              setTimeout(forceHideLiveChatWidget, 100);
            }
          });

          // Listen for new messages
          window.LiveChatWidget.on("new_event", (event) => {
            if (event.type === "message" && !chatOpen) {
              setUnreadCount((prev) => prev + 1);
              setLastMessageTime(new Date());
            }
          });

          // Listen for agent status
          window.LiveChatWidget.on("availability_changed", (data) => {
            setIsAgentOnline(data.availability === "online");
          });

          try {
            window.LiveChatWidget.get("state");
            setIsLiveChatReady(true);
          } catch (getError) {
            console.log(getError);
          }
        } catch (error) {
          console.log(error);
        }
      } else {
        console.log(
          `LiveChatWidget not found (attempt ${attempts}/${maxAttempts})`
        );
      }
    };

    initLiveChat();

    const checkInterval = setInterval(() => {
      if (window.LiveChatWidget && !isLiveChatReady) {
        initLiveChat();
        clearInterval(checkInterval);
      } else if (attempts >= maxAttempts) {
        console.log("Max attempts reached. LiveChat might not be loaded.");
        clearInterval(checkInterval);
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [isLiveChatReady, chatOpen, isMobile, forceHideLiveChatWidget]);

  // Handle mobile/desktop visibility with enhanced hiding
  useEffect(() => {
    if (!isLiveChatReady || !window.LiveChatWidget) return;

    try {
      if (isMobile) {
        console.log("Mobile detected - hiding default LiveChat");

        // Multiple methods to hide
        window.LiveChatWidget.call("hide");
        window.LiveChatWidget.call("minimize");

        // Force hide with multiple attempts
        setTimeout(forceHideLiveChatWidget, 50);
        setTimeout(forceHideLiveChatWidget, 200);
        setTimeout(forceHideLiveChatWidget, 500);
      }
    } catch (error) {
      console.log(`LiveChat visibility control failed: ${error.message}`);
    }
  }, [isMobile, isLiveChatReady, forceHideLiveChatWidget]);

  // Enhanced toggle function
  const toggleChat = useCallback(() => {
    if (!window.LiveChatWidget) {
      console.log("LiveChatWidget not available for toggle");
      return;
    }

    if (!isLiveChatReady) {
      console.log("LiveChat not ready for toggle");
      return;
    }

    try {
      if (chatOpen) {
        window.LiveChatWidget.call("minimize");
        setChatOpen(false);
        console.log("Chat minimized successfully");

        // Force hide default widget after minimize on mobile
        if (isMobile) {
          setTimeout(forceHideLiveChatWidget, 100);
          setTimeout(forceHideLiveChatWidget, 300);
        }
      } else {
        window.LiveChatWidget.call("maximize");
        setChatOpen(true);
        console.log("Chat maximized successfully");
        setUnreadCount(0); // Reset count when opening

        // Hide default widget even when maximized on mobile
        if (isMobile) {
          setTimeout(forceHideLiveChatWidget, 50);
          setTimeout(forceHideLiveChatWidget, 200);
          setTimeout(forceHideLiveChatWidget, 500);
        }
      }
    } catch (error) {
      console.log(`Toggle failed: ${error.message}`);
    }
  }, [chatOpen, isLiveChatReady, isMobile, forceHideLiveChatWidget]);

  // Monitor LiveChat state changes with enhanced hiding
  useEffect(() => {
    if (!isLiveChatReady || !window.LiveChatWidget) return;

    try {
      const handleVisibilityChange = (data) => {
        console.log(`Visibility changed: ${JSON.stringify(data)}`);
        if (data.visibility === "maximized") {
          setChatOpen(true);
          setUnreadCount(0);
          if (isMobile) {
            setTimeout(forceHideLiveChatWidget, 10);
            setTimeout(forceHideLiveChatWidget, 100);
          }
        } else if (data.visibility === "minimized") {
          setChatOpen(false);
          if (isMobile) {
            setTimeout(forceHideLiveChatWidget, 10);
            setTimeout(forceHideLiveChatWidget, 100);
          }
        }
      };

      window.LiveChatWidget.on("visibility_changed", handleVisibilityChange);

      return () => {
        try {
          window.LiveChatWidget.off(
            "visibility_changed",
            handleVisibilityChange
          );
        } catch (error) {
          console.log("Failed to remove event listener:", error);
        }
      };
    } catch (error) {
      console.log(`Event listener setup failed: ${error.message}`);
    }
  }, [isLiveChatReady, isMobile, forceHideLiveChatWidget]);

  // Enhanced global hide function
  useEffect(() => {
    window.forceLiveChatHide = forceHideLiveChatWidget;
  }, [forceHideLiveChatWidget]);

  if (!isMobile) return null;

  const formatTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes}m yang lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h yang lalu`;
    return "Kemarin";
  };

  return (
    <>
      {/* Main Chat Toggle Button */}
      <div className="fixed bottom-[150px] right-6 z-[999999]">
        {/* Floating Action Button */}
        <button
          onClick={toggleChat}
          disabled={!isLiveChatReady}
          className={`
            relative
            ${
              isLiveChatReady
                ? chatOpen
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/25"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/25"
                : "bg-gradient-to-r from-gray-400 to-gray-500 shadow-gray-500/25"
            }
            text-white 
            w-16 h-16
            rounded-full 
            shadow-2xl hover:shadow-2xl
            transition-all duration-300 ease-out
            flex items-center justify-center
            border-2 border-white/20
            active:scale-95
            backdrop-blur-sm
            ${
              !isLiveChatReady
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer"
            }
            hover:scale-105
            group
          `}
          aria-label={chatOpen ? "Tutup chat" : "Buka chat"}>
          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-100 transition-transform duration-150"></div>

          {/* Icon */}
          <div className="relative">
            {!isLiveChatReady ? (
              <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div>
            ) : chatOpen ? (
              <X size={24} className="transition-transform duration-200" />
            ) : (
              <MessageCircle
                size={22}
                className="transition-transform duration-200"
              />
            )}
          </div>

          {/* Unread Badge */}
          {unreadCount > 0 && !chatOpen && (
            <>
              {/* Pulse animation */}
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75"></div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold border-2 border-white shadow-lg">
                {unreadCount > 99 ? "99+" : unreadCount}
              </div>
            </>
          )}

          {/* Online indicator */}
          <div
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white transition-all duration-300 ${
              isAgentOnline ? "bg-green-400" : "bg-gray-400"
            }`}>
            {isAgentOnline && (
              <div className="absolute inset-0 rounded-full bg-green-400 animate-pulse"></div>
            )}
          </div>
        </button>

        {/* Status Tooltip */}
        {!chatOpen && (
          <div className="absolute bottom-20 right-0 transform translate-x-2">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 min-w-[280px] animate-in slide-in-from-bottom-2 duration-300">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isAgentOnline ? "bg-green-400" : "bg-gray-400"
                    }`}></div>
                  <span className="font-semibold text-gray-800">
                    {isAgentOnline ? "Tim Support Online" : "Offline"}
                  </span>
                </div>
                <Users size={16} className="text-gray-400" />
              </div>

              {/* Status message */}
              <p className="text-sm text-gray-600 mb-2">
                {isAgentOnline
                  ? "Kami siap membantu Anda!"
                  : "Tinggalkan pesan, kami akan membalas segera."}
              </p>

              {/* Unread messages info */}
              {unreadCount > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {unreadCount} pesan baru
                    </span>
                    {lastMessageTime && (
                      <span className="text-xs text-blue-600">
                        {formatTime(lastMessageTime)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  <span>Tim sedang mengetik...</span>
                </div>
              )}

              {/* CTA */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={toggleChat}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2">
                  <MessageCircle size={16} />
                  <span>Mulai Chat</span>
                </button>
              </div>

              {/* Arrow pointer */}
              <div className="absolute bottom-4 right-8 transform translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white filter drop-shadow-sm"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatCustomeLiveChat;
