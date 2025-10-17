"use client";
import { Tabs as MuiTabs, Tab as MuiTab, Box } from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";

// Reusable rounded tabs component with consistent styling
const roundedTabsStyles: SxProps<Theme> = {
  backgroundColor: "#1f2937",
  borderRadius: "12px",
  minHeight: "40px",
  padding: "3px",
  width: "fit-content",
  "& .MuiTabs-flexContainer": {
    gap: "4px",
  },
  "& .MuiTabs-indicator": {
    display: "none", // Hide the default indicator line
  },
  "& .MuiTab-root": {
    borderRadius: "8px",
    minHeight: "34px",
    minWidth: "110px",
    color: "#9ca3af",
    fontWeight: 600,
    fontSize: "14px",
    textTransform: "none",
    transition: "all 0.3s ease",
    "&.Mui-selected": {
      backgroundColor: "#ffffff",
      color: "#1f2937",
      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
    },
    "&:hover:not(.Mui-selected)": {
      backgroundColor: "#374151",
      color: "#d1d5db",
    },
  },
};

interface RoundedTabsProps {
  value: number;
  onChange: (event: React.SyntheticEvent, newValue: number) => void;
  children: React.ReactNode;
  centered?: boolean;
}

export function RoundedTabs({
  value,
  onChange,
  children,
  centered = false,
}: RoundedTabsProps) {
  return (
    <Box
      sx={{
        mb: 2,
        display: centered ? "flex" : "block",
        justifyContent: centered ? "center" : "flex-start",
      }}
    >
      <MuiTabs value={value} onChange={onChange} sx={roundedTabsStyles}>
        {children}
      </MuiTabs>
    </Box>
  );
}

export { MuiTab as Tab };
