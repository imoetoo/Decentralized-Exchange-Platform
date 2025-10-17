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
  TextField,
} from "@mui/material";

interface Token {
  symbol: string;
  name: string;
  network: string;
  icon: string;
  color: string;
}

interface CompactTokenSelectorProps {
  label: string;
  selectedToken: Token;
  onTokenChange: (token: Token) => void;
  availableTokens: Token[];
  amount: string;
  onAmountChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

export default function CompactTokenSelector({
  label,
  selectedToken,
  onTokenChange,
  availableTokens,
  amount,
  onAmountChange,
  placeholder = "0",
  helperText,
  disabled = false,
}: CompactTokenSelectorProps) {
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
          {/* Token Dropdown */}
          <FormControl sx={{ minWidth: 180 }}>
            <Select
              value={`${selectedToken.symbol}-${selectedToken.network}`}
              onChange={(e) => {
                const [symbol, network] = e.target.value.split("-");
                const token = availableTokens.find(
                  (t) => t.symbol === symbol && t.network === network
                );
                if (token) onTokenChange(token);
              }}
              sx={{
                "& .MuiSelect-select": {
                  py: 1,
                  fontSize: "0.875rem",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#4b5563",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#6b7280",
                },
              }}
            >
              {availableTokens.map((token, index) => (
                <MenuItem
                  key={`${token.symbol}-${token.network}-${index}`}
                  value={`${token.symbol}-${token.network}`}
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

          {/* Amount Input - Right Side */}
          <Box sx={{ textAlign: "right", minWidth: "120px" }}>
            <TextField
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              variant="standard"
              sx={{ width: "100%" }}
              slotProps={{
                input: {
                  sx: {
                    fontSize: "1.8rem",
                    fontWeight: "bold",
                    color: disabled ? "text.secondary" : "text.primary",
                    "& input": {
                      textAlign: "right",
                      border: "none",
                      background: "transparent",
                      padding: 0,
                    },
                    "&:before": {
                      display: "none",
                    },
                    "&:after": {
                      display: "none",
                    },
                    "&:hover:before": {
                      display: "none",
                    },
                  },
                },
              }}
            />
          </Box>
        </CardContent>
      </Card>
      {helperText && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 1,
            px: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            0 {selectedToken.symbol}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {helperText}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
