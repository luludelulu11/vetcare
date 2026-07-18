import { useEffect, useState } from "react";

/**
 * Shared dark/light toggle. Persists to localStorage and flips the
 * `data-theme` attribute on <html>, which every stylesheet's dark-mode
 * variables key off of.
 */
export default function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
