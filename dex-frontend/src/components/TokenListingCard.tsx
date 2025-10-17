"use client";
import { Card, CardContent, Typography, Box, Avatar } from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface TokenListingCardProps {
  title: string;
  provider: string;
}

export default function TokenListingCard({
  title,
  provider,
}: TokenListingCardProps) {
  const router = useRouter();

  const handleClick = () => {
    // Convert title to URL-friendly pair name
    // Replace slash with hyphen, make lowercase, replace whitespaces with hyphens, remove special characters
    const pairName = title
      .replace(/\//g, "-") // Replace slash with hyphen first
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    router.push(`/market/${pairName}`);
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        backgroundColor: "transparent",
        border: "1px solid #374151",
        "&:hover": {
          backgroundColor: "#1f2937",
          transform: "translateY(-2px)",
          transition: "all 0.3s ease",
          boxShadow: "0 8px 25px #14b8a615", // Teal glow on hover
        },
        cursor: "pointer",
        transition: "all 0.3s ease",
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          "&:last-child": { pb: 2 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              bgcolor: "#14b8a6", // Teal color for all trading pairs
              width: 48,
              height: 48,
            }}
          >
            <SwapHoriz />
          </Avatar>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "text.primary",
              }}
            >
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {provider}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              color: "#14b8a6", // Teal accent color
              mb: 0.5,
            }}
          >
            Trade Now
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View Order Book
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
