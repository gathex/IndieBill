"use client";

import { useState, useEffect } from "react";
import { DotGrid } from "./DotGrid";

export function HeroDotGrid() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const updateTheme = () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      if (currentTheme === "dark") {
        setTheme("dark");
      } else if (currentTheme === "light") {
        setTheme("light");
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        setTheme(prefersDark ? "dark" : "light");
      }
    };

    updateTheme();

    // Observe data-theme changes on <html>
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "attributes" && m.attributeName === "data-theme") {
          updateTheme();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Also observe system color scheme changes if no explicit theme is saved
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      if (!localStorage.getItem("theme")) {
        updateTheme();
      }
    };
    mql.addEventListener("change", handleMediaChange);

    return () => {
      observer.disconnect();
      mql.removeEventListener("change", handleMediaChange);
    };
  }, []);

  const isDark = theme === "dark";

  return (
    <DotGrid
      baseColor={isDark ? "#3f3f46" : "#a1a1aa"}
      activeColor={isDark ? "#ffffff" : "#2563eb"}
      opacity={isDark ? 0.65 : 0.6}
      dotSize={2.5}
      gap={18}
      shape="circle"
      proximity={170}
      strength={1}
      bounce={0.6}
      tension={0.55}
      returnDuration={0.8}
      shockRadius={320}
      shockStrength={5}
      swell={1.2}
      stretch={0.5}
      glow={0.6}
      fade={0}
      intro={true}
      mouseInteraction={true}
      clickShock={true}
      className="w-full h-full"
    />
  );
}

export default HeroDotGrid;
