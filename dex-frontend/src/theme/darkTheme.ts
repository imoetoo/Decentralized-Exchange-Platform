import { createTheme } from "@mui/material/styles";

// Standardized dark theme for the entire project
export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#000000",
      paper: "#111827",
    },
    primary: {
      main: "#3b82f6",
      light: "#60a5fa",
      dark: "#1d4ed8",
    },
    secondary: {
      main: "#14b8a6",
      light: "#2dd4bf",
      dark: "#0f766e",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    success: {
      main: "#10b981",
      light: "#34d399",
      dark: "#059669",
    },
    text: {
      primary: "#ffffff",
      secondary: "#9ca3af",
      disabled: "#6b7280",
    },
    divider: "#374151",
    grey: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
      lineHeight: 1.2,
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
      lineHeight: 1.2,
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.2,
    },
    h6: {
      fontWeight: 600,
      fontSize: "1rem",
      lineHeight: 1.2,
    },
  },
  components: {
    // Global component overrides
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#111827",
          border: "1px solid #374151",
          borderRadius: "0.5rem",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "0.5rem",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#1f2937",
            "& fieldset": {
              borderColor: "#4b5563",
            },
            "&:hover fieldset": {
              borderColor: "#6b7280",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#3b82f6",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "#1f2937",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#4b5563",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6b7280",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3b82f6",
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          "& .MuiTab-root": {
            color: "#9ca3af",
            fontWeight: 600,
          },
          "& .Mui-selected": {
            color: "#ffffff",
          },
          "& .MuiTabs-indicator": {
            backgroundColor: "#3b82f6",
          },
        },
      },
    },
  },
});

export default darkTheme;
