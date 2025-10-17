import { SxProps, Theme } from "@mui/material/styles";

// Mint tokens specific styles
export const mintContainerStyles: SxProps<Theme> = {
  maxWidth: "1200px",
  mx: "auto",
  mt: 4,
  px: 2,
};

export const mintLayoutStyles: SxProps<Theme> = {
  display: "flex",
  gap: 4,
  alignItems: "flex-start",
  "@media (max-width: 960px)": {
    flexDirection: "column",
    gap: 3,
  },
};

export const mintMainCardContainer: SxProps<Theme> = {
  flex: 1,
  maxWidth: "600px",
};

export const howItWorksContainer: SxProps<Theme> = {
  width: "320px",
  "@media (max-width: 960px)": {
    width: "100%",
    order: 2,
  },
};

export const mintCardStyles: SxProps<Theme> = {
  backgroundColor: "background.paper",
  border: "1px solid #374151",
  borderRadius: "1rem",
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
};

export const feeInfoStyles: SxProps<Theme> = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  py: 0.5,
};

export const connectButtonStyles: SxProps<Theme> = {
  width: "100%",
  py: 2.5,
  borderRadius: "12px",
  backgroundColor: "#f97316",
  color: "white",
  fontWeight: "bold",
  fontSize: "1.1rem",
  textTransform: "none",
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
  py: 1.5,
  cursor: "pointer",
  "&:hover": {
    backgroundColor: "#1f2937",
  },
  borderRadius: "8px",
  px: 1,
  transition: "background-color 0.2s",
};
