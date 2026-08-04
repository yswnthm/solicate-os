"use client";

import { useTheme, Theme } from "@/components/theme-provider";

interface ThemeToggleProps {
  variant?: "icon" | "segmented" | "menu";
  className?: string;
}

export function ThemeToggle({ variant = "icon", className = "" }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    if (theme === "system") {
      setTheme(resolvedTheme === "dark" ? "light" : "dark");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("system");
    }
  };

  if (variant === "segmented") {
    const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
      {
        value: "light",
        label: "Light",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.36 5.64l1.41-1.41" />
          </svg>
        ),
      },
      {
        value: "dark",
        label: "Dark",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        ),
      },
      {
        value: "system",
        label: "System",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <line x1="8" x2="16" y1="21" y2="21" />
            <line x1="12" x2="12" y1="17" y2="21" />
          </svg>
        ),
      },
    ];

    return (
      <div className={`theme-segmented-control ${className}`}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`theme-segment-btn ${theme === opt.value ? "active" : ""}`}
            onClick={() => setTheme(opt.value)}
            title={`Switch to ${opt.label} mode`}
          >
            <span className="theme-segment-icon">{opt.icon}</span>
            <span className="theme-segment-label">{opt.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTheme}
      title={`Current: ${theme} theme (${resolvedTheme}). Click to switch.`}
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <svg className="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M18.36 5.64l1.41-1.41" />
        </svg>
      ) : (
        <svg className="theme-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      )}
    </button>
  );
}
