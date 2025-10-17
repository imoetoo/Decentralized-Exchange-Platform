"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";

interface Token {
  symbol: string;
  name: string;
  network: string;
  icon: string;
  color: string;
}

interface TokenSelectorProps {
  label: string;
  selectedToken: Token;
  onTokenChange: (token: Token) => void;
  availableTokens: Token[];
}

export default function TokenSelector({
  label,
  selectedToken,
  onTokenChange,
  availableTokens,
}: TokenSelectorProps) {
  return (
    <Box>
      <Typography
        variant="body2"
        sx={{ mb: 1.5, color: "text.secondary", fontWeight: 600 }}
      >
        {label}
      </Typography>
      <Card
        sx={{
          backgroundColor: "#1f2937",
          border: "1px solid #4b5563",
          borderRadius: "12px",
          "&:hover": {
            borderColor: "#6b7280",
          },
        }}
      >
        <CardContent
          sx={{
            p: 2,
            "&:last-child": { pb: 2 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
            <Avatar
              sx={{
                bgcolor: selectedToken.color,
                width: 40,
                height: 40,
                fontSize: "1.2rem",
                fontWeight: "bold",
              }}
            >
              {selectedToken.icon}
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: "bold", color: "text.primary", mb: 0 }}
              >
                {selectedToken.symbol}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedToken.network}
              </Typography>
            </Box>
          </Box>
          <FormControl sx={{ minWidth: 50 }}>
            <Select
              value={selectedToken.symbol}
              onChange={(e) => {
                const token = availableTokens.find(
                  (t) => t.symbol === e.target.value
                );
                if (token) onTokenChange(token);
              }}
              displayEmpty
              sx={{
                "& .MuiSelect-select": {
                  p: 0,
                  border: "none",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
                "& .MuiSelect-icon": {
                  color: "text.secondary",
                },
              }}
            >
              {availableTokens.map((token) => (
                <MenuItem
                  key={`${token.symbol}-${token.network}`}
                  value={token.symbol}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: token.color,
                        width: 24,
                        height: 24,
                        fontSize: "0.8rem",
                      }}
                    >
                      {token.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="body2">{token.symbol}</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: "0.7rem" }}
                      >
                        {token.network}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>
    </Box>
  );
}
