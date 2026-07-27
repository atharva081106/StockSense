import React, { createContext, useContext, useState, useEffect } from "react";

const Ctx = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem("ss_theme") || "dark");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
    localStorage.setItem("ss_theme", theme);
    // Update body bg immediately for smooth transition
    document.body.style.background = theme === "dark" ? "#0d0805" : "#FFF8F0";
  }, [theme]);

  const toggleTheme = () => setTheme(p => p === "dark" ? "light" : "dark");

  return (
    <Ctx.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </Ctx.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme outside ThemeProvider");
  return ctx;
};
