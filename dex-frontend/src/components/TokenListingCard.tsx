"use client";
import { Card, CardContent, Typography, Box, Avatar } from "@mui/material";
import { useRouter } from "next/navigation";

interface TokenListingCardProps {
  title: string;
  provider: string;
}

// Helper function to get token image path
const getTokenImage = (tokenSymbol: string): string => {
  return `/tokenImages/${tokenSymbol.toLowerCase()}.png`;
};

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

  // Extract base and quote tokens from title (e.g., "USDC/USDT" -> ["USDC", "USDT"])
  const [baseToken, quoteToken] = title.split("/");

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
          {/* Token Pair Icon - Split design for all pairs */}
          <Box
            sx={{
              position: "relative",
              width: 48,
              height: 48,
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Base token (left) */}
            <Avatar
              src={getTokenImage(baseToken)}
              sx={{
                width: 36,
                height: 36,
                border: "2px solid #111827",
                position: "absolute",
                left: 0,
                zIndex: 2,
              }}
            />
            {/* Quote token (right, overlapping) */}
            <Avatar
              src={getTokenImage(quoteToken)}
              sx={{
                width: 36,
                height: 36,
                border: "2px solid #111827",
                position: "absolute",
                left: 18,
                zIndex: 1,
              }}
            />
          </Box>
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
