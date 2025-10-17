import { SxProps, Theme } from "@mui/material/styles";

// Hero Section Styles
export const heroContainerStyles: SxProps<Theme> = {
  position: "relative",
  zIndex: 10,
  textAlign: "center",
  px: 6,
  py: 20,
};

export const heroTitleStyles: SxProps<Theme> = {
  fontWeight: "bold",
  fontSize: { xs: "2.25rem", md: "3.75rem", lg: "4.5rem" },
  background: "linear-gradient(to right, #60a5fa, #a78bfa, #3b82f6)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
  lineHeight: 1.2,
  marginBottom: "3rem",
};

export const heroSubtitleStyles: SxProps<Theme> = {
  color: "#d1d5db",
  marginBottom: "3rem",
  maxWidth: "64rem",
  mx: "auto",
  fontSize: { xs: "1.125rem", md: "1.25rem" },
  fontWeight: 300,
  lineHeight: 1.6,
  textAlign: "center",
};

export const connectionStatusBoxStyles: SxProps<Theme> = {
  marginBottom: "3rem",
};

export const connectionStatusTextStyles = {
  connected: {
    color: "#10b981",
    marginBottom: "1rem",
    fontSize: "1.125rem",
  },
  disconnected: {
    color: "#fbbf24",
    marginBottom: "1rem",
    fontSize: "1.125rem",
  },
};

// Button Styles
export const primaryGradientButtonStyles: SxProps<Theme> = {
  background: "linear-gradient(to right, #2563eb, #7c3aed)",
  color: "white",
  paddingX: "2.5rem",
  paddingY: "1rem",
  fontSize: "1.125rem",
  fontWeight: 600,
  borderRadius: "9999px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  transform: "scale(1)",
  transition: "all 0.3s ease",
  "&:hover": {
    background: "linear-gradient(to right, #1d4ed8, #6d28d9)",
    transform: "scale(1.05)",
  },
};

export const outlinedButtonStyles: SxProps<Theme> = {
  border: "2px solid #9ca3af",
  color: "#d1d5db",
  paddingX: "2.5rem",
  paddingY: "1rem",
  fontSize: "1.125rem",
  fontWeight: 600,
  borderRadius: "9999px",
  transition: "all 0.3s ease",
  "&:hover": {
    borderColor: "white",
    color: "white",
  },
};

export const ctaButtonStyles: SxProps<Theme> = {
  backgroundColor: "white",
  color: "black",
  paddingX: "3rem",
  paddingY: "1rem",
  fontSize: "1.25rem",
  fontWeight: "bold",
  borderRadius: "9999px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  transform: "scale(1)",
  transition: "all 0.3s ease",
  "&:hover": {
    backgroundColor: "#e5e7eb",
    transform: "scale(1.05)",
  },
};

// Stats Section Styles
export const statsValueStyles = {
  blue: {
    fontWeight: "bold",
    color: "#60a5fa",
    marginBottom: "0.5rem",
  },
  purple: {
    fontWeight: "bold",
    color: "#a78bfa",
    marginBottom: "0.5rem",
  },
  green: {
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: "0.5rem",
  },
};

export const statsLabelStyles: SxProps<Theme> = {
  color: "#9ca3af",
};

// Section Styles
export const sectionTitleStyles: SxProps<Theme> = {
  fontWeight: "bold",
  color: "white",
  marginBottom: "1.5rem",
  fontSize: { xs: "1.875rem", md: "2.25rem" },
};

export const sectionSubtitleStyles: SxProps<Theme> = {
  color: "#9ca3af",
  maxWidth: "32rem",
  mx: "auto",
};

export const sectionContainerStyles: SxProps<Theme> = {
  px: 6,
};

// Card Styles
export const featureCardStyles: SxProps<Theme> = {
  backgroundColor: "black",
  border: "1px solid #374151",
  transition: "all 0.3s ease",
  transform: "scale(1)",
};

export const featureCardHoverStyles = {
  blue: {
    "&:hover": {
      borderColor: "#3b82f6",
      transform: "scale(1.05)",
    },
  },
  green: {
    "&:hover": {
      borderColor: "#10b981",
      transform: "scale(1.05)",
    },
  },
  purple: {
    "&:hover": {
      borderColor: "#8b5cf6",
      transform: "scale(1.05)",
    },
  },
};

export const cardContentStyles: SxProps<Theme> = {
  p: 8,
  textAlign: "center",
};

export const cardTitleStyles: SxProps<Theme> = {
  color: "white",
  marginBottom: "1rem",
  fontWeight: "bold",
};

export const cardDescriptionStyles: SxProps<Theme> = {
  color: "#9ca3af",
  marginBottom: "1.5rem",
  lineHeight: 1.6,
};

// Feature Button Styles
export const featureButtonStyles = {
  blue: {
    borderColor: "#60a5fa",
    color: "#60a5fa",
    borderRadius: "9999px",
    paddingX: "1.5rem",
    paddingY: "0.5rem",
    "&:hover": {
      backgroundColor: "#60a5fa",
      color: "black",
    },
  },
  green: {
    borderColor: "#10b981",
    color: "#10b981",
    borderRadius: "9999px",
    paddingX: "1.5rem",
    paddingY: "0.5rem",
    "&:hover": {
      backgroundColor: "#10b981",
      color: "black",
    },
  },
  purple: {
    borderColor: "#a78bfa",
    color: "#a78bfa",
    borderRadius: "9999px",
    paddingX: "1.5rem",
    paddingY: "0.5rem",
    "&:hover": {
      backgroundColor: "#a78bfa",
      color: "black",
    },
  },
};

// How It Works Section Styles
export const howItWorksStepTitleStyles: SxProps<Theme> = {
  color: "white",
  marginBottom: "1rem",
  fontWeight: 600,
};

export const howItWorksStepDescriptionStyles: SxProps<Theme> = {
  color: "#9ca3af",
  lineHeight: 1.6,
};

// CTA Section Styles
export const ctaSectionContainerStyles: SxProps<Theme> = {
  px: 6,
  textAlign: "center",
};

export const ctaTitleStyles: SxProps<Theme> = {
  fontWeight: "bold",
  color: "white",
  fontSize: { xs: "1.875rem", md: "2.25rem" },
  marginBottom: "2rem",
};

export const ctaSubtitleStyles: SxProps<Theme> = {
  color: "#d1d5db",
  maxWidth: "32rem",
  mx: "auto",
  marginBottom: "3rem",
};

// Tailwind CSS Class Names
export const classNames = {
  // Main container
  mainContainer: "min-h-screen bg-black text-white",

  // Hero section
  heroSection:
    "relative min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black",
  heroBackgroundPattern: "absolute inset-0 opacity-55",
  heroBackgroundGradient1:
    "absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(59,130,246,0.4),transparent_50%)]",
  heroBackgroundGradient2:
    "absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.4),transparent_50%)]",

  // Button containers
  ctaButtonContainer:
    "flex flex-col sm:flex-row gap-6 justify-center items-center mb-16",
  connectButtonContainer: "flex justify-center",

  // Stats grid
  statsGrid: "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto",
  statsItem: "text-center py-4",

  // Features section
  featuresSection: "py-20 bg-gray-900",
  featuresGrid: "grid grid-cols-1 md:grid-cols-3 gap-8",
  featureIconContainer: {
    blue: "w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6",
    green:
      "w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6",
    purple:
      "w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6",
  },

  // How it works section
  howItWorksSection: "py-20 bg-black",
  howItWorksGrid: "grid grid-cols-1 md:grid-cols-3 gap-12",
  howItWorksItem: "text-center",
  howItWorksStepIcon: {
    step1:
      "w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white",
    step2:
      "w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white",
    step3:
      "w-20 h-20 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white",
  },

  // CTA section
  ctaSection: "py-20 bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900",

  // Common section styles
  sectionTextCenter: "text-center mb-16",
};
