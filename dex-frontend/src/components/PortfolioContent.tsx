"use client";

import { useAccount } from "wagmi";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { AccountBalanceWallet, MonetizationOn } from "@mui/icons-material";
import * as commonStyles from "@/styles/commonStyles";

export default function PortfolioContent() {
  const { address, isConnected } = useAccount();
  const { balances, isLoading, error } = useTokenBalances();

  if (!isConnected) {
    return (
      <Box sx={commonStyles.pageContainerStyles}>
        <Container maxWidth="lg">
          <Card sx={commonStyles.cardStyles}>
            <CardContent
              sx={{
                p: 8,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <AccountBalanceWallet
                sx={{ fontSize: 80, color: "#6b7280", mb: 2 }}
              />
              <Typography
                variant="h4"
                sx={{ fontWeight: "bold", color: "text.primary", mb: 1 }}
              >
                Connect Your Wallet
              </Typography>
              <Typography variant="h6" sx={{ color: "text.secondary" }}>
                Please connect your wallet to view your portfolio
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={commonStyles.pageContainerStyles}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <MonetizationOn sx={{ fontSize: 40, color: "#3b82f6" }} />
            <Typography
              variant="h3"
              sx={{ fontWeight: "bold", color: "text.primary" }}
            >
              My Portfolio
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ color: "text.secondary", mb: 2 }}>
            View your token holdings
          </Typography>
          {address && (
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              {address}
            </Typography>
          )}
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <CircularProgress size={48} />
              <Typography variant="h6" sx={{ color: "text.secondary" }}>
                Loading your tokens...
              </Typography>
            </Box>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading balances: {error.message}
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && balances.length === 0 && (
          <Card sx={commonStyles.cardStyles}>
            <CardContent
              sx={{
                p: 8,
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
              }}
            >
              <MonetizationOn sx={{ fontSize: 64, color: "#6b7280", mb: 2 }} />
              <Typography
                variant="h5"
                sx={{ fontWeight: "600", color: "text.primary", mb: 1 }}
              >
                No tokens found
              </Typography>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                You don't have any tokens in your wallet yet
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Token List - Table View */}
        {!isLoading && !error && balances.length > 0 && (
          <Card sx={commonStyles.cardStyles}>
            <CardContent sx={{ p: 3 }}>
              {/* Header */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: "bold", color: "text.primary", mb: 0.5 }}
                >
                  Your supplies
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {balances.length} {balances.length === 1 ? "asset" : "assets"}
                </Typography>
              </Box>

              {/* Table */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: "text.secondary",
                          fontWeight: "600",
                          borderBottom: "1px solid #374151",
                          pb: 2,
                        }}
                      >
                        Asset
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          color: "text.secondary",
                          fontWeight: "600",
                          borderBottom: "1px solid #374151",
                          pb: 2,
                        }}
                      >
                        Balance
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {balances.map((token) => (
                      <TableRow
                        key={token.address}
                        sx={{
                          "&:hover": { backgroundColor: "#1f293710" },
                          "&:last-child td": { borderBottom: 0 },
                        }}
                      >
                        <TableCell
                          sx={{
                            borderBottom: "1px solid #37415120",
                            py: 2.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                background:
                                  "linear-gradient(to bottom right, #3b82f6, #7c3aed)",
                                fontSize: "0.875rem",
                                fontWeight: "bold",
                              }}
                            >
                              {token.symbol.substring(0, 2)}
                            </Avatar>
                            <Box>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: "600",
                                  color: "text.primary",
                                  mb: 0.25,
                                }}
                              >
                                {token.symbol}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  fontFamily: "monospace",
                                  fontSize: "0.7rem",
                                }}
                              >
                                {token.address}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            borderBottom: "1px solid #37415120",
                            py: 2.5,
                          }}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: "600",
                              color: "text.primary",
                            }}
                          >
                            {parseFloat(token.balance).toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                              minimumFractionDigits: 2,
                            })}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Container>
    </Box>
  );
}
