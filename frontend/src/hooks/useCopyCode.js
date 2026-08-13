import { useState, useRef, useEffect, useCallback } from "react";

// Hook untuk handle copy text content
export const useCopyText = () => {
  const [copied, setCopied] = useState(false);

  const copyText = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
        return false;
      }
    }
  }, []);

  return { copied, copyText };
};

// Hook untuk handle copy dari DOM element dengan opsi untuk copy mode
export const useCopyFromElement = (copyMode = "text") => {
  const [copied, setCopied] = useState(false);
  const elementRef = useRef(null);

  const copyFromElement = useCallback(async () => {
    if (!elementRef.current) return false;

    try {
      let textContent = "";

      if (copyMode === "html") {
        textContent = elementRef.current.innerHTML;
      } else {
        // For text mode, we need to handle code blocks specially
        textContent = extractTextContent(elementRef.current);
      }

      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch (err) {
      // Fallback for older browsers
      try {
        let textContent = "";

        if (copyMode === "html") {
          textContent = elementRef.current.innerHTML;
        } else {
          textContent = extractTextContent(elementRef.current);
        }

        const textArea = document.createElement("textarea");
        textArea.value = textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
        return false;
      }
    }
  }, [copyMode]);

  return { copied, copyFromElement, elementRef };
};

// Function to extract text content properly, handling code blocks
const extractTextContent = (element) => {
  let text = "";

  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();

      // Handle line breaks for block elements
      if (
        ["div", "p", "br", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tagName)
      ) {
        if (text && !text.endsWith("\n")) {
          text += "\n";
        }
      }

      // Handle code blocks - preserve formatting
      if (tagName === "pre") {
        const codeElement = node.querySelector("code") || node;
        text += codeElement.textContent || codeElement.innerText || "";
        text += "\n";
        return; // Don't walk children as we already got the text
      }

      // Handle inline code
      if (
        tagName === "code" &&
        node.parentElement?.tagName.toLowerCase() !== "pre"
      ) {
        text += node.textContent || node.innerText || "";
        return;
      }

      // Walk through children for other elements
      for (let child of node.childNodes) {
        walk(child);
      }

      // Add line break after block elements
      if (
        [
          "div",
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "blockquote",
          "li",
        ].includes(tagName)
      ) {
        if (text && !text.endsWith("\n")) {
          text += "\n";
        }
      }
    }
  };

  walk(element);
  return text.trim();
};

// Hook untuk auto-inject copy buttons ke code blocks
export const useCodeBlockCopy = (containerRef, dependencies = []) => {
  useEffect(() => {
    if (!containerRef.current) return;

    const preBlocks = containerRef.current.querySelectorAll("pre");

    preBlocks.forEach((pre) => {
      // Skip if already has copy button
      if (pre.querySelector(".copy-code-btn")) return;

      // Create copy button
      const copyBtn = document.createElement("button");
      copyBtn.className = "copy-code-btn";
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      `;
      copyBtn.title = "Copy code";
      copyBtn.setAttribute("aria-label", "Copy code to clipboard");

      const handleCopyClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
          // Get the code content, prioritizing <code> element if exists
          const codeElement = pre.querySelector("code") || pre;
          const codeContent =
            codeElement.textContent || codeElement.innerText || "";

          await navigator.clipboard.writeText(codeContent);

          // Success feedback
          copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
          `;
          copyBtn.style.color = "#10b981";
          copyBtn.title = "Copied!";

          // Reset after 2 seconds
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
              </svg>
            `;
            copyBtn.style.color = "";
            copyBtn.title = "Copy code";
          }, 2000);
        } catch (err) {
          console.error("Failed to copy code:", err);

          // Fallback
          try {
            const codeElement = pre.querySelector("code") || pre;
            const codeContent =
              codeElement.textContent || codeElement.innerText || "";

            const textArea = document.createElement("textarea");
            textArea.value = codeContent;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);

            // Success feedback for fallback
            copyBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20,6 9,17 4,12"></polyline>
              </svg>
            `;
            copyBtn.style.color = "#10b981";

            setTimeout(() => {
              copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              `;
              copyBtn.style.color = "";
            }, 2000);
          } catch (fallbackErr) {
            console.error("Fallback copy also failed:", fallbackErr);

            // Show error feedback
            copyBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            `;
            copyBtn.style.color = "#ef4444";
            copyBtn.title = "Copy failed";

            setTimeout(() => {
              copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              `;
              copyBtn.style.color = "";
              copyBtn.title = "Copy code";
            }, 2000);
          }
        }
      };

      copyBtn.addEventListener("click", handleCopyClick);

      // Make sure pre block has relative positioning for button positioning
      if (getComputedStyle(pre).position === "static") {
        pre.style.position = "relative";
      }

      pre.appendChild(copyBtn);
    });

    // Cleanup function
    return () => {
      if (!containerRef.current) return;

      const preBlocks = containerRef.current.querySelectorAll("pre");
      preBlocks?.forEach((pre) => {
        const copyBtn = pre.querySelector(".copy-code-btn");
        if (copyBtn) {
          copyBtn.removeEventListener("click", copyBtn.handleCopyClick);
          copyBtn.remove();
        }
      });
    };
  }, dependencies);
};

// Combined hook khusus untuk Code Blocks Quill saja
export const useQuillCodeCopy = (dependencies = []) => {
  const elementRef = useRef(null);

  // Auto-inject copy buttons hanya untuk Quill code blocks
  useCodeBlockCopy(elementRef, dependencies);

  return {
    elementRef,
  };
};
