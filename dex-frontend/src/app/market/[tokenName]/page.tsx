"use client";

import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Divider,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ArrowBack, SwapHoriz, Close } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAccount } from "wagmi";
import * as commonStyles from "@/styles/commonStyles";
import { useDex, formatPrice, formatTokenAmount } from "@/hooks/useDex";
import {
  OrderType,
  OrderKind,
  USDT_ADDRESS,
  USDC_ADDRESS,
  WETH_ADDRESS,
  WBTC_ADDRESS,
  EIGEN_ADDRESS,
  PEPE_ADDRESS,
  DAI_ADDRESS,
} from "@/constants";

// Token pair data
const tokenPairs: {
  [key: string]: {
    base: string;
    quote: string;
    baseName: string;
    quoteName: string;
    swappablePair?: string; // For pairs that can be swapped (like USDC/USDT <-> USDT/USDC)
  };
} = {
  "usdc-usdt": {
    base: USDC_ADDRESS,
    quote: USDT_ADDRESS,
    baseName: "USDC",
    quoteName: "USDT",
    swappablePair: "usdt-usdc",
  },
  "usdt-usdc": {
    base: USDT_ADDRESS,
    quote: USDC_ADDRESS,
    baseName: "USDT",
    quoteName: "USDC",
    swappablePair: "usdc-usdt",
  },
  "weth-usdc": {
    base: WETH_ADDRESS,
    quote: USDC_ADDRESS,
    baseName: "WETH",
    quoteName: "USDC",
    swappablePair: "usdc-weth",
  },
  "usdc-weth": {
    base: USDC_ADDRESS,
    quote: WETH_ADDRESS,
    baseName: "USDC",
    quoteName: "WETH",
    swappablePair: "weth-usdc",
  },
  "wbtc-usdt": {
    base: WBTC_ADDRESS,
    quote: USDT_ADDRESS,
    baseName: "WBTC",
    quoteName: "USDT",
    swappablePair: "usdt-wbtc",
  },
  "usdt-wbtc": {
    base: USDT_ADDRESS,
    quote: WBTC_ADDRESS,
    baseName: "USDT",
    quoteName: "WBTC",
    swappablePair: "wbtc-usdt",
  },
  "eigen-usdc": {
    base: EIGEN_ADDRESS,
    quote: USDC_ADDRESS,
    baseName: "EIGEN",
    quoteName: "USDC",
    swappablePair: "usdc-eigen",
  },
  "usdc-eigen": {
    base: USDC_ADDRESS,
    quote: EIGEN_ADDRESS,
    baseName: "USDC",
    quoteName: "EIGEN",
    swappablePair: "eigen-usdc",
  },
  "pepe-usdt": {
    base: PEPE_ADDRESS,
    quote: USDT_ADDRESS,
    baseName: "PEPE",
    quoteName: "USDT",
    swappablePair: "usdt-pepe",
  },
  "usdt-pepe": {
    base: USDT_ADDRESS,
    quote: PEPE_ADDRESS,
    baseName: "USDT",
    quoteName: "PEPE",
    swappablePair: "pepe-usdt",
  },
  "dai-usdc": {
    base: DAI_ADDRESS,
    quote: USDC_ADDRESS,
    baseName: "DAI",
    quoteName: "USDC",
    swappablePair: "usdc-dai",
  },
  "usdc-dai": {
    base: USDC_ADDRESS,
    quote: DAI_ADDRESS,
    baseName: "USDC",
    quoteName: "DAI",
    swappablePair: "dai-usdc",
  },
};

// Helper function to get token image path
const getTokenImage = (tokenSymbol: string): string => {
  return `/tokenImages/${tokenSymbol.toLowerCase()}.png`;
};

export default function TradingPage() {
  const router = useRouter();
  const params = useParams();
  const { address, isConnected } = useAccount();
  const pairName = params?.tokenName as string;

  const [tradeType, setTradeType] = useState<OrderType>(OrderType.BUY);
  const [orderKind, setOrderKind] = useState<OrderKind>(OrderKind.LIMIT);
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [pendingAction, setPendingAction] = useState<
    "approve" | "order" | "cancel" | null
  >(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<bigint | null>(
    null
  );
  const [showAlert, setShowAlert] = useState(true);

  // Get token pair info
  const pairInfo = tokenPairs[pairName];

  // Connect to DEX contract
  const {
    orderBook,
    isLoadingOrders,
    placeLimitOrder,
    cancelOrder,
    approveToken,
    isPending,
    isConfirming,
    isConfirmed,
    error,
    baseAllowance,
    quoteAllowance,
    baseBalance,
    quoteBalance,
  } = useDex(pairInfo?.base, pairInfo?.quote);

  // Reset form after successful order placement (not approval)
  useEffect(() => {
    if (isConfirmed && pendingAction === "order") {
      // Show alert immediately
      setShowAlert(true);
      // Wait a bit before resetting to show success message
      const timer = setTimeout(() => {
        setAmount("");
        setPrice("");
        setPendingAction(null);
        setShowAlert(false); // Hide alert after 10 seconds
      }, 10000); // Show success message for 10 seconds
      return () => clearTimeout(timer);
    } else if (isConfirmed && pendingAction === "cancel") {
      // Show alert immediately
      setShowAlert(true);
      // Reset cancel state after confirmation
      const timer = setTimeout(() => {
        setPendingAction(null);
        setCancellingOrderId(null);
        setShowAlert(false);
      }, 10000);
      return () => clearTimeout(timer);
    } else if (isConfirmed && pendingAction === "approve") {
      // Show alert immediately
      setShowAlert(true);
      // After approval confirms, automatically place the order
      const placeOrder = async () => {
        try {
          setPendingAction("order");
          if (orderKind === OrderKind.LIMIT) {
            await placeLimitOrder(tradeType, amount, price);
          } else {
            alert(`${orderKind} orders are not implemented yet. Coming soon!`);
          }
        } catch (err) {
          console.error("Error placing order after approval:", err);
          setPendingAction(null);
          setShowAlert(false);
        }
      };
      // Small delay to show approval success, then place order
      const timer = setTimeout(() => {
        placeOrder();
      }, 1000); // 1 second delay to show approval success
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, pendingAction]);

  if (!pairInfo) {
    return (
      <Box sx={commonStyles.pageContainerStyles}>
        <Container maxWidth="lg">
          <Typography variant="h4" color="text.primary">
            Trading pair not found
          </Typography>
        </Container>
      </Box>
    );
  }

  const handleBackClick = () => {
    router.push("/market");
  };

  const handleSwapPair = () => {
    if (pairInfo?.swappablePair) {
      // Reset form when swapping pairs
      setAmount("");
      setPrice("");
      router.push(`/market/${pairInfo.swappablePair}`);
    }
  };

  const handleTradeTypeChange = (type: OrderType) => {
    setTradeType(type);
  };

  const handlePlaceOrder = async () => {
    if (!amount || !price) {
      alert("Please enter both amount and price");
      return;
    }

    if (!isConnected) {
      alert("Please connect your wallet");
      return;
    }

    try {
      // Reset alert visibility for new transaction
      setShowAlert(true);

      // Check if approval is needed first
      if (needsApproval()) {
        setPendingAction("approve");
        // Approve the token that will be spent
        const tokenToApprove =
          tradeType === OrderType.SELL ? pairInfo.base : pairInfo.quote;
        // For BUY orders, approve the total quote amount (amount * price)
        // For SELL orders, approve the base amount
        const amountToApprove =
          tradeType === OrderType.BUY ? calculateTotal() : amount;
        await approveToken(tokenToApprove, amountToApprove);
        // Don't place order yet - wait for approval to confirm
        // The approval confirmation will be handled by useEffect
        return;
      }

      // If approval is not needed or already done, place the order
      setPendingAction("order");
      // For limit orders
      if (orderKind === OrderKind.LIMIT) {
        await placeLimitOrder(tradeType, amount, price);
      } else {
        alert(`${orderKind} orders are not implemented yet. Coming soon!`);
      }
    } catch (err) {
      console.error("Error placing order:", err);
      setPendingAction(null);
    }
  };

  const handleCancelOrder = async (orderId: bigint) => {
    if (!isConnected) {
      alert("Please connect your wallet");
      return;
    }

    try {
      setShowAlert(true);
      setPendingAction("cancel");
      setCancellingOrderId(orderId);
      await cancelOrder(orderId);
    } catch (err) {
      console.error("Error cancelling order:", err);
      setPendingAction(null);
      setCancellingOrderId(null);
    }
  };

  const isUserOrder = (order: any) => {
    return address && order.trader.toLowerCase() === address.toLowerCase();
  };

  const needsApproval = () => {
    if (!amount || !price) return false;

    // For SELL orders, check base token allowance against amount
    if (tradeType === OrderType.SELL) {
      if (!baseAllowance) return true;
      const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
      return BigInt(baseAllowance.toString()) < requiredAmount;
    }

    // For BUY orders, check quote token allowance against total (amount * price)
    if (!quoteAllowance) return true;
    const requiredAmount = BigInt(
      Math.floor(parseFloat(calculateTotal()) * 1e6)
    );
    return BigInt(quoteAllowance.toString()) < requiredAmount;
  };

  const calculateTotal = () => {
    if (!amount || !price) return "0.00";
    return (parseFloat(amount) * parseFloat(price)).toFixed(6);
  };

  const getCurrentBalance = () => {
    if (tradeType === OrderType.SELL) {
      return baseBalance || BigInt(0);
    } else {
      return quoteBalance || BigInt(0);
    }
  };

  const hasInsufficientBalance = () => {
    if (!amount || !price) return false;

    const currentBalance = getCurrentBalance();

    if (tradeType === OrderType.SELL) {
      // For SELL orders, check if we have enough base tokens
      const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
      return currentBalance < requiredAmount;
    } else {
      // For BUY orders, check if we have enough quote tokens (total cost)
      const requiredAmount = BigInt(
        Math.floor(parseFloat(calculateTotal()) * 1e6)
      );
      return currentBalance < requiredAmount;
    }
  };

  return (
    <Box sx={commonStyles.pageContainerStyles}>
      <Container maxWidth="xl">
        {/* Back Button */}
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackClick}
          sx={{ mb: 3, color: "text.secondary" }}
        >
          Back to Market
        </Button>

        {/* Header with Pair Info */}
        <Card sx={{ ...commonStyles.cardStyles, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              {/* Token Pair Icon - Split design for all pairs */}
              <Box
                sx={{
                  position: "relative",
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {/* First token (left) - Base token */}
                <Avatar
                  src={getTokenImage(pairInfo.baseName)}
                  sx={{
                    width: 48,
                    height: 48,
                    border: "3px solid #111827",
                    position: "absolute",
                    left: 0,
                    zIndex: 2,
                  }}
                />
                {/* Second token (right, overlapping) - Quote token */}
                <Avatar
                  src={getTokenImage(pairInfo.quoteName)}
                  sx={{
                    width: 48,
                    height: 48,
                    border: "3px solid #111827",
                    position: "absolute",
                    left: 24,
                    zIndex: 1,
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: "bold", color: "text.primary", mb: 1 }}
                >
                  {pairInfo.baseName}/{pairInfo.quoteName}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Trade {pairInfo.baseName} against {pairInfo.quoteName}
                </Typography>
              </Box>
              {/* Swap Button - Only show for swappable pairs */}
              {pairInfo?.swappablePair && (
                <Tooltip
                  title={`Switch to ${pairInfo.quoteName}/${pairInfo.baseName}`}
                >
                  <IconButton
                    onClick={handleSwapPair}
                    sx={{
                      backgroundColor: "#1f2937",
                      border: "2px solid #14b8a6",
                      color: "#14b8a6",
                      width: 48,
                      height: 48,
                      "&:hover": {
                        backgroundColor: "#14b8a6",
                        color: "#111827",
                        transform: "rotate(180deg)",
                        transition: "all 0.3s ease",
                      },
                      transition: "all 0.3s ease",
                    }}
                  >
                    <SwapHoriz />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Transaction Status */}
        {showAlert && (isPending || isConfirming || isConfirmed || error) && (
          <Alert
            severity={error ? "error" : isConfirmed ? "success" : "info"}
            sx={{ mb: 3 }}
          >
            {error && `Error: ${error.message}`}
            {isPending &&
              `Please confirm the ${
                pendingAction === "approve"
                  ? "approval"
                  : pendingAction === "cancel"
                  ? "cancellation"
                  : "order"
              } in your wallet...`}
            {isConfirming &&
              `${
                pendingAction === "approve"
                  ? "Approval"
                  : pendingAction === "cancel"
                  ? "Cancellation"
                  : "Order"
              } is being confirmed...`}
            {isConfirmed &&
              pendingAction === "approve" &&
              "Approval confirmed! Confirm again to place your order."}
            {isConfirmed &&
              pendingAction === "order" &&
              "Order placed successfully!"}
            {isConfirmed &&
              pendingAction === "cancel" &&
              "Order cancelled successfully!"}
          </Alert>
        )}

        {/* Main Trading Interface */}
        <Box
          sx={{
            display: "flex",
            gap: 3,
            flexDirection: { xs: "column", md: "row" },
          }}
        >
          {/* Order Book */}
          <Card sx={{ ...commonStyles.cardStyles, flex: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                sx={{ mb: 3, fontWeight: "bold", color: "text.primary" }}
              >
                Order Book
              </Typography>

              {isLoadingOrders ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: "flex", gap: 3 }}>
                  {/* Sell Orders */}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, color: "#ef4444", fontWeight: "bold" }}
                    >
                      SELL ORDERS
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                color: "text.secondary",
                                fontWeight: "bold",
                              }}
                            >
                              Price
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "text.secondary",
                                fontWeight: "bold",
                              }}
                            >
                              Amount
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "text.secondary",
                                fontWeight: "bold",
                              }}
                            >
                              Total
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "text.secondary",
                                fontWeight: "bold",
                                width: "60px",
                              }}
                            >
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orderBook.sellOrders.length > 0 ? (
                            orderBook.sellOrders.slice(0, 10).map((order) => {
                              const amountFormatted = formatTokenAmount(
                                order.amount - order.filled
                              );
                              const priceFormatted = formatPrice(order.price);
                              const total = (
                                parseFloat(amountFormatted) *
                                parseFloat(priceFormatted)
                              ).toFixed(6);
                              const isOwner = isUserOrder(order);
                              const isCancelling =
                                pendingAction === "cancel" &&
                                cancellingOrderId === order.id;

                              return (
                                <TableRow
                                  key={order.id.toString()}
                                  sx={{
                                    "&:hover": { backgroundColor: "#1f2937" },
                                  }}
                                >
                                  <TableCell
                                    sx={{ color: "#ef4444", fontWeight: "600" }}
                                  >
                                    {priceFormatted}
                                  </TableCell>
                                  <TableCell sx={{ color: "text.primary" }}>
                                    {amountFormatted}
                                  </TableCell>
                                  <TableCell sx={{ color: "text.secondary" }}>
                                    {total}
                                  </TableCell>
                                  <TableCell>
                                    {isOwner && (
                                      <Tooltip title="Cancel order">
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleCancelOrder(order.id)
                                          }
                                          disabled={
                                            isPending ||
                                            isConfirming ||
                                            isCancelling
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
                                              size={16}
                                              sx={{ color: "#ef4444" }}
                                            />
                                          ) : (
                                            <Close fontSize="small" />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                sx={{
                                  textAlign: "center",
                                  color: "text.secondary",
                                  py: 3,
                                }}
                              >
                                No sell orders
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>

                  <Divider orientation="vertical" flexItem />

                  {/* Buy Orders */}
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{ mb: 2, color: "#10b981", fontWeight: "bold" }}
                    >
                      BUY ORDERS
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell
                              sx={{
                                color: "text.secondary",
                                fontWeight: "bold",
                              }}
                            >
                              Price
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "text.secondary",
                                fontWeight: "bold",
                              }}
                            >
                              Amount
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "text.secondary",
                                fontWeight: "bold",
                              }}
                            >
                              Total
                            </TableCell>
                            <TableCell
                              sx={{
                                color: "text.secondary",
                                fontWeight: "bold",
                                width: "60px",
                              }}
                            >
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {orderBook.buyOrders.length > 0 ? (
                            orderBook.buyOrders.slice(0, 10).map((order) => {
                              const amountFormatted = formatTokenAmount(
                                order.amount - order.filled
                              );
                              const priceFormatted = formatPrice(order.price);
                              const total = (
                                parseFloat(amountFormatted) *
                                parseFloat(priceFormatted)
                              ).toFixed(6);
                              const isOwner = isUserOrder(order);
                              const isCancelling =
                                pendingAction === "cancel" &&
                                cancellingOrderId === order.id;

                              return (
                                <TableRow
                                  key={order.id.toString()}
                                  sx={{
                                    "&:hover": { backgroundColor: "#1f2937" },
                                  }}
                                >
                                  <TableCell
                                    sx={{ color: "#10b981", fontWeight: "600" }}
                                  >
                                    {priceFormatted}
                                  </TableCell>
                                  <TableCell sx={{ color: "text.primary" }}>
                                    {amountFormatted}
                                  </TableCell>
                                  <TableCell sx={{ color: "text.secondary" }}>
                                    {total}
                                  </TableCell>
                                  <TableCell>
                                    {isOwner && (
                                      <Tooltip title="Cancel order">
                                        <IconButton
                                          size="small"
                                          onClick={() =>
                                            handleCancelOrder(order.id)
                                          }
                                          disabled={
                                            isPending ||
                                            isConfirming ||
                                            isCancelling
                                          }
                                          sx={{
                                            color: "#10b981",
                                            "&:hover": {
                                              backgroundColor: "#064e3b",
                                            },
                                            "&:disabled": {
                                              color: "#6b7280",
                                            },
                                          }}
                                        >
                                          {isCancelling ? (
                                            <CircularProgress
                                              size={16}
                                              sx={{ color: "#10b981" }}
                                            />
                                          ) : (
                                            <Close fontSize="small" />
                                          )}
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={4}
                                sx={{
                                  textAlign: "center",
                                  color: "text.secondary",
                                  py: 3,
                                }}
                              >
                                No buy orders
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Trading Panel */}
          <Card sx={{ ...commonStyles.cardStyles, flex: 1, minWidth: "400px" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="h5"
                sx={{ mb: 3, fontWeight: "bold", color: "text.primary" }}
              >
                Place Order
              </Typography>

              {/* Order Type Selector (Future-proofed) */}
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="body2"
                  sx={{ mb: 1, color: "text.secondary" }}
                >
                  Order Type
                </Typography>
                <FormControl fullWidth size="small">
                  <Select
                    value={orderKind}
                    onChange={(e) => setOrderKind(e.target.value as OrderKind)}
                    sx={commonStyles.inputFieldStyles}
                  >
                    <MenuItem value={OrderKind.LIMIT}>Limit Order</MenuItem>
                    <MenuItem value={OrderKind.MARKET} disabled>
                      Market Order (Coming Soon)
                    </MenuItem>
                    <MenuItem value={OrderKind.STOP_LOSS} disabled>
                      Stop Loss (Coming Soon)
                    </MenuItem>
                    <MenuItem value={OrderKind.STOP_LIMIT} disabled>
                      Stop Limit (Coming Soon)
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Buy/Sell Toggle */}
              <Box
                sx={{
                  display: "flex",
                  mb: 3,
                  backgroundColor: "#1f2937",
                  borderRadius: "12px",
                  p: "4px",
                }}
              >
                <Button
                  fullWidth
                  variant={tradeType === OrderType.BUY ? "contained" : "text"}
                  onClick={() => handleTradeTypeChange(OrderType.BUY)}
                  sx={{
                    borderRadius: "8px",
                    backgroundColor:
                      tradeType === OrderType.BUY ? "#10b981" : "transparent",
                    color:
                      tradeType === OrderType.BUY ? "white" : "text.secondary",
                    "&:hover": {
                      backgroundColor:
                        tradeType === OrderType.BUY ? "#059669" : "#374151",
                    },
                  }}
                >
                  Buy {pairInfo.baseName}
                </Button>
                <Button
                  fullWidth
                  variant={tradeType === OrderType.SELL ? "contained" : "text"}
                  onClick={() => handleTradeTypeChange(OrderType.SELL)}
                  sx={{
                    borderRadius: "8px",
                    backgroundColor:
                      tradeType === OrderType.SELL ? "#ef4444" : "transparent",
                    color:
                      tradeType === OrderType.SELL ? "white" : "text.secondary",
                    "&:hover": {
                      backgroundColor:
                        tradeType === OrderType.SELL ? "#dc2626" : "#374151",
                    },
                  }}
                >
                  Sell {pairInfo.baseName}
                </Button>
              </Box>

              {/* Input Fields */}
              <Stack spacing={3}>
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: "text.secondary" }}
                  >
                    Amount ({pairInfo.baseName})
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="0.00"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    slotProps={{
                      input: {
                        sx: commonStyles.inputFieldStyles,
                      },
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: "text.secondary" }}
                  >
                    Price ({pairInfo.quoteName} per {pairInfo.baseName})
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder="0.00"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    slotProps={{
                      input: {
                        sx: commonStyles.inputFieldStyles,
                      },
                    }}
                  />
                </Box>

                <Box
                  sx={{ p: 2, backgroundColor: "#1f2937", borderRadius: "8px" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Total Cost:
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {calculateTotal()} {pairInfo.quoteName}
                    </Typography>
                  </Box>
                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Balance:
                    </Typography>
                    <Typography variant="body2" color="text.primary">
                      {getCurrentBalance()
                        ? formatTokenAmount(getCurrentBalance())
                        : "0.00"}{" "}
                      {tradeType === OrderType.SELL
                        ? pairInfo.baseName
                        : pairInfo.quoteName}
                    </Typography>
                  </Box>
                </Box>

                {/* Insufficient Balance Warning */}
                {isConnected && hasInsufficientBalance() && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Insufficient balance. You need{" "}
                    {tradeType === OrderType.SELL ? amount : calculateTotal()}{" "}
                    {tradeType === OrderType.SELL
                      ? pairInfo.baseName
                      : pairInfo.quoteName}{" "}
                    but only have {formatTokenAmount(getCurrentBalance())}.
                  </Alert>
                )}

                {isConnected ? (
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handlePlaceOrder}
                    disabled={
                      isPending ||
                      isConfirming ||
                      !amount ||
                      !price ||
                      hasInsufficientBalance()
                    }
                    sx={{
                      backgroundColor:
                        tradeType === OrderType.BUY ? "#10b981" : "#ef4444",
                      color: "white",
                      fontWeight: "bold",
                      py: 1.5,
                      "&:hover": {
                        backgroundColor:
                          tradeType === OrderType.BUY ? "#059669" : "#dc2626",
                      },
                      "&:disabled": {
                        backgroundColor: "#374151",
                        color: "#6b7280",
                      },
                    }}
                  >
                    {isPending || isConfirming
                      ? pendingAction === "approve"
                        ? `Approving ${
                            tradeType === OrderType.SELL
                              ? pairInfo.baseName
                              : pairInfo.quoteName
                          }...`
                        : "Placing Order..."
                      : hasInsufficientBalance()
                      ? "Insufficient Balance"
                      : needsApproval()
                      ? `Approve ${
                          tradeType === OrderType.SELL
                            ? pairInfo.baseName
                            : pairInfo.quoteName
                        }`
                      : `${tradeType === OrderType.BUY ? "Buy" : "Sell"} ${
                          pairInfo.baseName
                        }`}
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: "#4b5563",
                      color: "text.secondary",
                      fontWeight: "bold",
                      py: 1.5,
                      "&:hover": {
                        borderColor: "#6b7280",
                        backgroundColor: "#1f2937",
                      },
                    }}
                  >
                    Connect Wallet to Trade
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </Box>
  );
}
