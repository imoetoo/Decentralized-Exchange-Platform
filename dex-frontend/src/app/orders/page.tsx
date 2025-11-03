"use client";

import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import { Close, Refresh } from "@mui/icons-material";
import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import * as commonStyles from "@/styles/commonStyles";
import { useUserOrders } from "@/hooks/useUserOrders";
import {
  useDex,
  formatPrice,
  formatTokenAmount,
  Order,
  StopLimitOrder,
} from "@/hooks/useDex";
import { OrderType, OrderKind } from "@/constants";
import {
  USDT_ADDRESS,
  USDC_ADDRESS,
  DAI_ADDRESS,
  EIGEN_ADDRESS,
  PEPE_ADDRESS,
  WBTC_ADDRESS,
  WETH_ADDRESS,
} from "@/constants";

// Token address to symbol mapping
const TOKEN_SYMBOLS: { [key: string]: string } = {
  [USDT_ADDRESS.toLowerCase()]: "USDT",
  [USDC_ADDRESS.toLowerCase()]: "USDC",
  [DAI_ADDRESS.toLowerCase()]: "DAI",
  [EIGEN_ADDRESS.toLowerCase()]: "EIGEN",
  [PEPE_ADDRESS.toLowerCase()]: "PEPE",
  [WBTC_ADDRESS.toLowerCase()]: "WBTC",
  [WETH_ADDRESS.toLowerCase()]: "WETH",
};

const getTokenSymbol = (address: string): string => {
  return TOKEN_SYMBOLS[address.toLowerCase()] || "UNKNOWN";
};

export default function OrdersPage() {
  const { address, isConnected } = useAccount();
  const {
    userOrders,
    stopLimitOrders,
    tradeHistory,
    isLoading,
    refresh,
    lastUpdated,
  } = useUserOrders();
  const {
    cancelOrder,
    cancelStopLimit,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  } = useDex();

  const [tabValue, setTabValue] = useState(0);
  const [cancellingOrderId, setCancellingOrderId] = useState<bigint | null>(
    null
  );
  const [cancellingStopId, setCancellingStopId] = useState<bigint | null>(null);
  const [showAlert, setShowAlert] = useState(true);

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    if (tabValue === 0) {
      // All open orders - combine regular and stop limit orders
      return [...userOrders, ...stopLimitOrders];
    } else if (tabValue === 1) {
      // Buy orders only
      return [...userOrders, ...stopLimitOrders].filter(
        (order) => order.action === OrderType.BUY
      );
    } else if (tabValue === 2) {
      // Sell orders only
      return [...userOrders, ...stopLimitOrders].filter(
        (order) => order.action === OrderType.SELL
      );
    } else {
      // Trade history (closed orders)
      return tradeHistory;
    }
  }, [userOrders, stopLimitOrders, tradeHistory, tabValue]);

  const handleCancelOrder = async (
    orderId: bigint,
    isStopOrder: boolean = false
  ) => {
    if (!isConnected) {
      alert("Please connect your wallet");
      return;
    }

    try {
      setShowAlert(true);
      if (isStopOrder) {
        setCancellingStopId(orderId);
        await cancelStopLimit(orderId);
      } else {
        setCancellingOrderId(orderId);
        await cancelOrder(orderId);
      }
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      setCancellingOrderId(null);
      setCancellingStopId(null);
      setShowAlert(true);

      // Check if user rejected the transaction
      if (
        err?.message?.includes("User rejected") ||
        err?.message?.includes("user rejected") ||
        err?.code === 4001 ||
        err?.code === "ACTION_REJECTED"
      ) {
        alert("Cancellation cancelled. No changes were made.");
      } else {
        alert(
          `Failed to cancel order: ${
            err?.message || "Unknown error"
          }. Please try again.`
        );
      }
    }
  };

  const handleCancelAll = () => {
    if (!isConnected || filteredOrders.length === 0) return;

    if (
      window.confirm(
        `Are you sure you want to cancel all ${filteredOrders.length} open orders?`
      )
    ) {
      filteredOrders.forEach((order) => {
        const isStopOrder = "stopPrice" in order && "limitPrice" in order;
        handleCancelOrder(order.id, isStopOrder);
      });
    }
  };

  // Reset cancelling state when transaction confirms
  useState(() => {
    if (isConfirmed) {
      const timer = setTimeout(() => {
        setCancellingOrderId(null);
        setCancellingStopId(null);
        setShowAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  });

  if (!isConnected) {
    return (
      <Box sx={commonStyles.pageContainerStyles}>
        <Container maxWidth="lg">
          <Card sx={commonStyles.cardStyles}>
            <CardContent sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                Connect your wallet to view your orders
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={commonStyles.pageContainerStyles}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "text.primary" }}
          >
            Orders
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            {lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </Typography>
            )}
            <Button
              variant="outlined"
              color="primary"
              onClick={refresh}
              disabled={isLoading}
              startIcon={<Refresh />}
              sx={{
                borderColor: "#14b8a6",
                color: "#14b8a6",
                "&:hover": {
                  borderColor: "#0d9488",
                  backgroundColor: "#134e4a",
                },
              }}
            >
              Refresh
            </Button>
            {tabValue < 3 && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelAll}
                disabled={
                  filteredOrders.length === 0 || isPending || isConfirming
                }
                sx={{
                  borderColor: "#ef4444",
                  color: "#ef4444",
                  "&:hover": {
                    borderColor: "#dc2626",
                    backgroundColor: "#7f1d1d",
                  },
                }}
              >
                Cancel All Open Orders
              </Button>
            )}
          </Box>
        </Box>

        {/* Transaction Status */}
        {showAlert && (isPending || isConfirming || isConfirmed || error) && (
          <Alert
            severity={error ? "error" : isConfirmed ? "success" : "info"}
            sx={{ mb: 3 }}
            onClose={() => setShowAlert(false)}
          >
            {error &&
              (() => {
                const errorMsg = error.message || String(error);
                // Check if user rejected the transaction
                if (
                  errorMsg.includes("User rejected") ||
                  errorMsg.includes("user rejected") ||
                  errorMsg.includes("User denied")
                ) {
                  return "Cancellation cancelled. No changes were made.";
                }
                // Show a friendly error message
                return "Failed to cancel order. Please try again.";
              })()}
            {isPending && "Please confirm the cancellation in your wallet..."}
            {isConfirming && "Cancellation is being confirmed..."}
            {isConfirmed && "Order cancelled successfully!"}
          </Alert>
        )}

        {/* Tabs */}
        <Card sx={commonStyles.cardStyles}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                "& .MuiTab-root": {
                  color: "text.secondary",
                  fontWeight: "bold",
                  fontSize: "0.95rem",
                  textTransform: "none",
                  minWidth: 120,
                },
                "& .Mui-selected": {
                  color: "#14b8a6 !important",
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#14b8a6",
                },
              }}
            >
              <Tab label="Open Orders" />
              <Tab label="Buy Orders" />
              <Tab label="Sell Orders" />
              <Tab label="Trade History" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: 3 }}>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredOrders.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h6" color="text.secondary">
                  {tabValue === 3 ? "No trade history" : "No open orders"}
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ color: "text.secondary", fontWeight: "bold" }}
                      >
                        Asset
                      </TableCell>
                      <TableCell
                        sx={{ color: "text.secondary", fontWeight: "bold" }}
                      >
                        Type
                      </TableCell>
                      <TableCell
                        sx={{ color: "text.secondary", fontWeight: "bold" }}
                      >
                        Status
                      </TableCell>
                      <TableCell
                        sx={{ color: "text.secondary", fontWeight: "bold" }}
                      >
                        Order Info
                      </TableCell>
                      <TableCell
                        sx={{ color: "text.secondary", fontWeight: "bold" }}
                      >
                        Total Amount
                      </TableCell>
                      {tabValue < 3 && (
                        <TableCell
                          sx={{ color: "text.secondary", fontWeight: "bold" }}
                        >
                          Action
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredOrders.map((order) => {
                      const baseSymbol = getTokenSymbol(order.base);
                      const quoteSymbol = getTokenSymbol(order.quote);

                      // Check if this is a stop limit order
                      const isStopOrder =
                        "stopPrice" in order && "limitPrice" in order;
                      const regularOrder = !isStopOrder
                        ? (order as Order)
                        : null;
                      const stopOrder = isStopOrder
                        ? (order as StopLimitOrder)
                        : null;

                      const amountFormatted = formatTokenAmount(order.amount);
                      const filledFormatted = regularOrder
                        ? formatTokenAmount(regularOrder.filled)
                        : "0.00";

                      // For stop orders, show limit price; for regular orders, show price
                      const priceFormatted = isStopOrder
                        ? formatPrice(stopOrder!.limitPrice)
                        : formatPrice(regularOrder!.price);

                      const stopPriceFormatted = isStopOrder
                        ? formatPrice(stopOrder!.stopPrice)
                        : null;

                      const total = (
                        parseFloat(amountFormatted) * parseFloat(priceFormatted)
                      ).toFixed(6);

                      const filledPercent =
                        regularOrder && regularOrder.amount > 0
                          ? (
                              (Number(regularOrder.filled) /
                                Number(regularOrder.amount)) *
                              100
                            ).toFixed(2)
                          : "0.00";

                      const isCancelling = isStopOrder
                        ? cancellingStopId === order.id
                        : cancellingOrderId === order.id;

                      // Determine order type label
                      let orderTypeLabel: string;
                      if (isStopOrder) {
                        orderTypeLabel =
                          order.action === OrderType.BUY
                            ? "Stop-Limit Buy"
                            : "Stop-Limit Sell";
                      } else if (regularOrder?.orderKind === OrderKind.LIMIT) {
                        orderTypeLabel =
                          order.action === OrderType.BUY
                            ? "Limit Buy"
                            : "Limit Sell";
                      } else if (
                        regularOrder?.orderKind === OrderKind.TAKE_ORDER
                      ) {
                        orderTypeLabel =
                          order.action === OrderType.BUY
                            ? "Take/Market Buy"
                            : "Take/Market Sell";
                      } else {
                        // Fallback for orders without orderKind
                        orderTypeLabel =
                          order.action === OrderType.BUY ? "Buy" : "Sell";
                      }

                      return (
                        <TableRow
                          key={order.id.toString()}
                          sx={{
                            "&:hover": { backgroundColor: "#1f2937" },
                          }}
                        >
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "600", color: "text.primary" }}
                            >
                              {baseSymbol}/{quoteSymbol}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {new Date(
                                Number(order.ts) * 1000
                              ).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={orderTypeLabel}
                              size="small"
                              sx={{
                                backgroundColor:
                                  order.action === OrderType.BUY
                                    ? "#10b98120"
                                    : "#ef444420",
                                color:
                                  order.action === OrderType.BUY
                                    ? "#10b981"
                                    : "#ef4444",
                                fontWeight: "bold",
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {tabValue === 3 ? (
                              // Trade History - show if fully or partially filled
                              regularOrder &&
                              regularOrder.filled === regularOrder.amount ? (
                                <Chip
                                  label="Fully Filled"
                                  size="small"
                                  sx={{
                                    backgroundColor: "#10b98120",
                                    color: "#10b981",
                                    fontWeight: "bold",
                                  }}
                                />
                              ) : (
                                <Chip
                                  label={`Partially Filled (${filledPercent}%)`}
                                  size="small"
                                  sx={{
                                    backgroundColor: "#14b8a620",
                                    color: "#14b8a6",
                                    fontWeight: "bold",
                                  }}
                                />
                              )
                            ) : isStopOrder ? (
                              <Chip
                                label="Pending"
                                size="small"
                                sx={{
                                  backgroundColor: "#f59e0b20",
                                  color: "#f59e0b",
                                  fontWeight: "bold",
                                }}
                              />
                            ) : (
                              <Chip
                                label={`${filledPercent}%`}
                                size="small"
                                sx={{
                                  backgroundColor: "#14b8a620",
                                  color: "#14b8a6",
                                  fontWeight: "bold",
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {tabValue === 3 ? (
                              // Trade History - show filled amounts
                              <>
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                >
                                  Filled: {filledFormatted}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Price: {priceFormatted}
                                </Typography>
                              </>
                            ) : (
                              <>
                                <Typography
                                  variant="body2"
                                  color="text.primary"
                                >
                                  Amt: {amountFormatted}
                                </Typography>
                                {isStopOrder ? (
                                  <>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Stop: {stopPriceFormatted}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                    >
                                      Limit: {priceFormatted}
                                    </Typography>
                                  </>
                                ) : (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Price: {priceFormatted}
                                  </Typography>
                                )}
                              </>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: "600", color: "text.primary" }}
                            >
                              {tabValue === 3
                                ? (
                                    parseFloat(filledFormatted) *
                                    parseFloat(priceFormatted)
                                  ).toFixed(6)
                                : total}
                            </Typography>
                          </TableCell>
                          {tabValue < 3 && (
                            <TableCell>
                              <Tooltip title="Cancel order">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleCancelOrder(order.id, isStopOrder)
                                    }
                                    disabled={
                                      isPending || isConfirming || isCancelling
                                    }
                                    sx={{
                                      color: "#ef4444",
                                      "&:hover": {
                                        backgroundColor: "#7f1d1d",
                                      },
                                      "&:disabled": {
                                        color: "#6b7280",
                                      },
                                    }}
                                  >
                                    {isCancelling ? (
                                      <CircularProgress
                                        size={20}
                                        sx={{ color: "#ef4444" }}
                                      />
                                    ) : (
                                      <Close fontSize="small" />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
