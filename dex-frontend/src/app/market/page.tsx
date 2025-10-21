"use client";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  Stack,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useState } from "react";
import TokenListingCard from "@/components/TokenListingCard";
import { RoundedTabs, Tab } from "@/components/RoundedTabs";
import * as commonStyles from "@/styles/commonStyles";
import { tradingPairs } from "./tokenListings";

export default function TokenMarket() {
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Filter listings based on search term
  const filteredListings = tradingPairs.filter((listing) => {
    const matchesSearch =
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.baseToken.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.quoteToken.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <Box sx={commonStyles.pageContainerStyles}>
      <Container maxWidth="lg">
        {/* Main Content Card */}
        <Card sx={commonStyles.cardStyles}>
          <CardContent sx={{ p: 3 }}>
            {/* Header */}
            <Box sx={commonStyles.headerSectionStyles}>
              <Typography
                variant="h4"
                component="h1" /* for SEO */
                sx={{
                  fontWeight: "bold",
                  color: "text.primary",
                }}
              >
                Browse Trading Pairs
              </Typography>
            </Box>

            {/* Search Bar */}
            <TextField
              fullWidth
              placeholder="Search for a trading pair (e.g., USDT/USDC)"
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ mb: 3 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  sx: commonStyles.inputFieldStyles,
                },
              }}
            />

            {/* Results Count */}
            <Box
              sx={{
                ...commonStyles.filtersContainerStyles,
                justifyContent: "flex-start",
                mb: 3,
              }}
            >
              <Box sx={{ color: "text.secondary" }}>
                <Typography
                  component="span"
                  sx={{ fontWeight: 600, color: "text.primary" }}
                >
                  {filteredListings.length}{" "}
                  {filteredListings.length === 1
                    ? "Trading Pair"
                    : "Trading Pairs"}
                </Typography>
              </Box>
            </Box>

            {/* Listings */}
            <Stack spacing={2}>
              {filteredListings.length > 0 ? (
                filteredListings.map((listing, index) => (
                  <TokenListingCard
                    key={index}
                    title={listing.title}
                    provider={listing.provider}
                  />
                ))
              ) : (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="h6" color="text.secondary">
                    No trading pairs found for &quot;{searchTerm}&quot;
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Try searching with different keywords or clear your search.
                  </Typography>
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
