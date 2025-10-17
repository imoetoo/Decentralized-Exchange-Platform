import { SxProps, Theme } from "@mui/material/styles";

// Common card styles for insurance listings and forms
export const cardStyles: SxProps<Theme> = {
  backgroundColor: "background.paper",
  border: "1px solid #374151",
  borderRadius: "0.5rem",
};

// Common input field styles for search and form inputs
export const inputFieldStyles: SxProps<Theme> = {
  backgroundColor: "#1f2937",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#4b5563",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#6b7280",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "primary.main",
  },
};

// Common select dropdown styles
export const selectStyles: SxProps<Theme> = {
  backgroundColor: "#1f2937",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#4b5563",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "#6b7280",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "primary.main",
  },
};

// Page container styles
export const pageContainerStyles: SxProps<Theme> = {
  minHeight: "100vh",
  backgroundColor: "background.default",
  pt: 6,
};

// Header section styles
export const headerSectionStyles: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  mb: 3,
};

// Mint tokens specific styles
export const mintContainerStyles: SxProps<Theme> = {
  maxWidth: "480px",
  mx: "auto",
  mt: 4,
};

export const mintCardStyles: SxProps<Theme> = {
  backgroundColor: "background.paper",
  border: "1px solid #374151",
  borderRadius: "1rem",
  p: 3,
};

export const feeInfoStyles: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  py: 1,
};

export const connectButtonStyles: SxProps<Theme> = {
  width: "100%",
  py: 2,
  borderRadius: "12px",
  backgroundColor: "#f97316",
  color: "white",
  fontWeight: "bold",
  fontSize: "1.1rem",
  "&:hover": {
    backgroundColor: "#ea580c",
  },
  "&:disabled": {
    backgroundColor: "#374151",
    color: "#6b7280",
  },
};

export const addressToggleStyles: SxProps<Theme> = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  py: 2,
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#1f2937",
  },
  borderRadius: "8px",
  px: 1,
};

// Filters container styles
export const filtersContainerStyles: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  mb: 3,
};

// Common gradient backgrounds
export const gradientBackgrounds = {
  bluePurple: "linear-gradient(to right, #2563eb, #7c3aed)",
  bluePurpleHover: "linear-gradient(to right, #1d4ed8, #6d28d9)",
  textGradient: "linear-gradient(to right, #60a5fa, #a78bfa, #3b82f6)",
};

// Common colors
export const themeColors = {
  blue: "#60a5fa",
  blueHover: "#3b82f6",
  purple: "#a78bfa",
  purpleHover: "#8b5cf6",
  green: "#10b981",
  yellow: "#fbbf24",
  grayLight: "#d1d5db",
  grayMedium: "#9ca3af",
  grayDark: "#374151",
  grayBorder: "#4b5563",
};

// Common spacing
export const commonSpacing = {
  sectionPadding: { px: 6 },
  largePadding: { p: 8 },
  mediumMargin: { marginBottom: "1.5rem" },
  largeMargin: { marginBottom: "3rem" },
  smallMargin: { marginBottom: "1rem" },
};

// Common typography styles
export const typographyStyles = {
  sectionTitle: {
    fontWeight: "bold",
    color: "white",
    fontSize: { xs: "1.875rem", md: "2.25rem" },
  },
  sectionSubtitle: {
    color: "#9ca3af",
    maxWidth: "32rem",
    mx: "auto",
  },
  cardTitle: {
    color: "white",
    fontWeight: "bold",
  },
  cardDescription: {
    color: "#9ca3af",
    lineHeight: 1.6,
  },
};
