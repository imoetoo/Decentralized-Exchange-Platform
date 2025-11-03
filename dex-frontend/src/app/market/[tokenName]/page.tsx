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
import { useDex, formatPrice, formatTokenAmount, Order } from "@/hooks/useDex";
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
  const [stopPrice, setStopPrice] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<bigint | null>(null);
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
    placeStopLimit,
    takeOrder,
    executeMarketOrder,
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
        setStopPrice("");
        setLimitPrice("");
        setSelectedOrderId(null);
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
          } else if (orderKind === OrderKind.MARKET) {
            await executeMarketOrder(tradeType, amount);
          } else if (orderKind === OrderKind.TAKE_ORDER) {
            if (!selectedOrderId) {
              alert("Please select an order to take");
              setPendingAction(null);
              return;
            }
            await takeOrder(selectedOrderId, amount || "0");
          } else if (orderKind === OrderKind.STOP_LIMIT) {
            await placeStopLimit(tradeType, amount, stopPrice, limitPrice);
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
      setStopPrice("");
      setLimitPrice("");
      setSelectedOrderId(null);
      router.push(`/market/${pairInfo.swappablePair}`);
    }
  };

  const handleTradeTypeChange = (type: OrderType) => {
    setTradeType(type);
  };

  const handlePlaceOrder = async () => {
    // Validate inputs based on order kind
    if (orderKind === OrderKind.LIMIT) {
      if (!amount || !price) {
        alert("Please enter both amount and price");
        return;
      }
    } else if (orderKind === OrderKind.MARKET) {
      if (!amount) {
        alert("Please enter the amount you want to trade");
        return;
      }
      // Check if there are orders available
      const hasOrders =
        tradeType === OrderType.BUY
          ? orderBook.sellOrders.length > 0
          : orderBook.buyOrders.length > 0;
      if (!hasOrders) {
        alert("No orders available in the order book");
        return;
      }
    } else if (orderKind === OrderKind.TAKE_ORDER) {
      if (!selectedOrderId) {
        alert("Please click on an order in the order book to select it");
        return;
      }
      if (!amount) {
        alert(
          "Please enter the amount you want to trade (or 0 for full amount)"
        );
        return;
      }
    } else if (orderKind === OrderKind.STOP_LIMIT) {
      if (!amount || !stopPrice || !limitPrice) {
        alert("Please enter amount, stop price, and limit price");
        return;
      }
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

        // Calculate the amount to approve based on order type
        let amountToApprove: string;

        if (tradeType === OrderType.BUY) {
          // For BUY orders, approve quote tokens
          if (orderKind === OrderKind.LIMIT) {
            amountToApprove = calculateTotal();
          } else if (orderKind === OrderKind.STOP_LIMIT) {
            // For stop-limit, use limitPrice * amount
            amountToApprove = (
              parseFloat(amount) * parseFloat(limitPrice)
            ).toFixed(6);
          } else {
            // Market and Take Order
            amountToApprove = calculateMarketTotal();
          }
        } else {
          // For SELL orders, approve base tokens (just the amount)
          amountToApprove = amount;
        }

        await approveToken(tokenToApprove, amountToApprove);
        // Don't place order yet - wait for approval to confirm
        // The approval confirmation will be handled by useEffect
        return;
      }

      // If approval is not needed or already done, place the order
      setPendingAction("order");
      if (orderKind === OrderKind.LIMIT) {
        await placeLimitOrder(tradeType, amount, price);
      } else if (orderKind === OrderKind.MARKET) {
        await executeMarketOrder(tradeType, amount);
      } else if (orderKind === OrderKind.TAKE_ORDER) {
        if (!selectedOrderId) {
          alert("Please select an order to take");
          return;
        }
        await takeOrder(selectedOrderId, amount || "0");
      } else if (orderKind === OrderKind.STOP_LIMIT) {
        await placeStopLimit(tradeType, amount, stopPrice, limitPrice);
      }
    } catch (err: any) {
      console.error("Error placing order:", err);
      setPendingAction(null);
      setShowAlert(true);

      // Check if user rejected the transaction
      if (
        err?.message?.includes("User rejected") ||
        err?.message?.includes("user rejected") ||
        err?.code === 4001 ||
        err?.code === "ACTION_REJECTED"
      ) {
        alert("Transaction cancelled. Please try again when ready.");
      } else {
        alert(
          `Transaction failed: ${
            err?.message || "Unknown error"
          }. Please try again.`
        );
      }
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
    } catch (err: any) {
      console.error("Error cancelling order:", err);
      setPendingAction(null);
      setCancellingOrderId(null);
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

  const handleSelectOrder = (order: Order) => {
    // Only allow selecting orders for take orders
    if (orderKind !== OrderKind.TAKE_ORDER) return;

    setSelectedOrderId(order.id);
    // Auto-fill the price field with the selected order's price
    setPrice(formatPrice(order.price));
    // Optionally auto-fill amount with remaining amount
    if (!amount) {
      setAmount(formatTokenAmount(order.amount - order.filled));
    }
  };

  const isUserOrder = (order: Order) => {
    return address && order.trader.toLowerCase() === address.toLowerCase();
  };

  const needsApproval = () => {
    if (orderKind === OrderKind.LIMIT) {
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
    } else if (orderKind === OrderKind.MARKET) {
      if (!amount) return false;
      // Get the best order to calculate required amount
      const bestOrder =
        tradeType === OrderType.BUY
          ? orderBook.sellOrders[0]
          : orderBook.buyOrders[0];
      if (!bestOrder) return false;

      // For market BUY, we're taking a SELL order (need quote tokens)
      // For market SELL, we're taking a BUY order (need base tokens)
      if (tradeType === OrderType.BUY) {
        if (!quoteAllowance) return true;
        const requiredAmount = BigInt(
          Math.floor(parseFloat(calculateMarketTotal()) * 1e6)
        );
        return BigInt(quoteAllowance.toString()) < requiredAmount;
      } else {
        if (!baseAllowance) return true;
        const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
        return BigInt(baseAllowance.toString()) < requiredAmount;
      }
    } else if (orderKind === OrderKind.TAKE_ORDER) {
      if (!selectedOrderId || !amount) return false;
      const selectedOrder =
        tradeType === OrderType.BUY
          ? orderBook.sellOrders.find((o) => o.id === selectedOrderId)
          : orderBook.buyOrders.find((o) => o.id === selectedOrderId);
      if (!selectedOrder) return false;

      // For take order BUY, we're taking a SELL order (need quote tokens)
      // For take order SELL, we're taking a BUY order (need base tokens)
      if (tradeType === OrderType.BUY) {
        if (!quoteAllowance) return true;
        const requiredAmount = BigInt(
          Math.floor(parseFloat(calculateMarketTotal()) * 1e6)
        );
        return BigInt(quoteAllowance.toString()) < requiredAmount;
      } else {
        if (!baseAllowance) return true;
        const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
        return BigInt(baseAllowance.toString()) < requiredAmount;
      }
    } else if (orderKind === OrderKind.STOP_LIMIT) {
      if (!amount || !stopPrice || !limitPrice) return false;
      // For SELL orders, check base token allowance
      if (tradeType === OrderType.SELL) {
        if (!baseAllowance) return true;
        const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
        return BigInt(baseAllowance.toString()) < requiredAmount;
      }
      // For BUY orders, check quote token allowance against limit price
      if (!quoteAllowance) return true;
      const requiredAmount = BigInt(
        Math.floor(parseFloat(amount) * parseFloat(limitPrice) * 1e6)
      );
      return BigInt(quoteAllowance.toString()) < requiredAmount;
    }
    return false;
  };

  const calculateTotal = () => {
    if (!amount || !price) return "0.00";
    return (parseFloat(amount) * parseFloat(price)).toFixed(6);
  };

  const calculateMarketTotal = () => {
    if (!amount) return "0.00";

    let targetOrder: Order | null = null;

    if (orderKind === OrderKind.MARKET) {
      // For MARKET orders, use the best price from order book
      targetOrder =
        tradeType === OrderType.BUY
          ? orderBook.sellOrders[0] || null // Lowest sell price
          : orderBook.buyOrders[0] || null; // Highest buy price
    } else if (orderKind === OrderKind.TAKE_ORDER && selectedOrderId) {
      // For TAKE_ORDER, use the selected order
      targetOrder =
        tradeType === OrderType.BUY
          ? orderBook.sellOrders.find((o) => o.id === selectedOrderId) || null
          : orderBook.buyOrders.find((o) => o.id === selectedOrderId) || null;
    }

    if (!targetOrder) return "0.00";

    const orderPrice = parseFloat(formatPrice(targetOrder.price));
    const tradeAmount =
      amount === "0"
        ? parseFloat(formatTokenAmount(targetOrder.amount - targetOrder.filled))
        : parseFloat(amount);

    return (tradeAmount * orderPrice).toFixed(6);
  };

  const getCurrentBalance = () => {
    if (tradeType === OrderType.SELL) {
      return baseBalance || BigInt(0);
    } else {
      return quoteBalance || BigInt(0);
    }
  };

  const hasInsufficientBalance = () => {
    const currentBalance = getCurrentBalance();

    if (orderKind === OrderKind.LIMIT) {
      if (!amount || !price) return false;
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
    } else if (
      orderKind === OrderKind.MARKET ||
      orderKind === OrderKind.TAKE_ORDER
    ) {
      if (!amount) return false;
      if (tradeType === OrderType.SELL) {
        const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
        return currentBalance < requiredAmount;
      } else {
        const requiredAmount = BigInt(
          Math.floor(parseFloat(calculateMarketTotal()) * 1e6)
        );
        return currentBalance < requiredAmount;
      }
    } else if (orderKind === OrderKind.STOP_LIMIT) {
      if (!amount || !limitPrice) return false;
      if (tradeType === OrderType.SELL) {
        const requiredAmount = BigInt(Math.floor(parseFloat(amount) * 1e6));
        return currentBalance < requiredAmount;
      } else {
        const requiredAmount = BigInt(
          Math.floor(parseFloat(amount) * parseFloat(limitPrice) * 1e6)
        );
        return currentBalance < requiredAmount;
      }
    }
    return false;
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
            {error &&
              (() => {
                const errorMsg = error.message || String(error);
                // Check if user rejected the transaction
                if (
                  errorMsg.includes("User rejected") ||
                  errorMsg.includes("user rejected") ||
                  errorMsg.includes("User denied")
                ) {
                  return "Transaction cancelled. Please try again when ready.";
                }
                // Show a friendly error message
                return "Transaction failed. Please try again.";
              })()}
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
                              const isSelected = selectedOrderId === order.id;
                              const isClickable =
                                orderKind === OrderKind.TAKE_ORDER &&
                                tradeType === OrderType.BUY;

                              return (
                                <TableRow
                                  key={order.id.toString()}
                                  onClick={() =>
                                    isClickable && handleSelectOrder(order)
                                  }
                                  sx={{
                                    "&:hover": {
                                      backgroundColor: isClickable
                                        ? "#2d3748"
                                        : "#1f2937",
                                      cursor: isClickable
                                        ? "pointer"
                                        : "default",
                                    },
                                    backgroundColor: isSelected
                                      ? "#1e3a5f"
                                      : "transparent",
                                    border: isSelected
                                      ? "2px solid #3b82f6"
                                      : "none",
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
                              const isSelected = selectedOrderId === order.id;
                              const isClickable =
                                orderKind === OrderKind.TAKE_ORDER &&
                                tradeType === OrderType.SELL;

                              return (
                                <TableRow
                                  key={order.id.toString()}
                                  onClick={() =>
                                    isClickable && handleSelectOrder(order)
                                  }
                                  sx={{
                                    "&:hover": {
                                      backgroundColor: isClickable
                                        ? "#2d3748"
                                        : "#1f2937",
                                      cursor: isClickable
                                        ? "pointer"
                                        : "default",
                                    },
                                    backgroundColor: isSelected
                                      ? "#1e3a5f"
                                      : "transparent",
                                    border: isSelected
                                      ? "2px solid #3b82f6"
                                      : "none",
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
                    onChange={(e) => {
                      setOrderKind(e.target.value as OrderKind);
                      // Reset fields when switching order types
                      setSelectedOrderId(null);
                      setPrice("");
                      setStopPrice("");
                      setLimitPrice("");
                    }}
                    sx={commonStyles.inputFieldStyles}
                  >
                    <MenuItem value={OrderKind.LIMIT}>Limit Order</MenuItem>
                    <MenuItem value={OrderKind.MARKET}>
                      Market Order (Best Price)
                    </MenuItem>
                    <MenuItem value={OrderKind.TAKE_ORDER}>
                      Take Order (Select Specific)
                    </MenuItem>
                    <MenuItem value={OrderKind.STOP_LIMIT}>
                      Stop Limit Order
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
                {/* Market Order Information */}
                {orderKind === OrderKind.MARKET && (
                  <Alert severity="info">
                    Market order will automatically execute at the best
                    available price in the order book.
                  </Alert>
                )}

                {/* Take Order Information */}
                {orderKind === OrderKind.TAKE_ORDER && (
                  <Alert severity="info">
                    Click on a specific order in the order book to select it,
                    then enter the amount you want to trade (or 0 for full
                    amount).
                  </Alert>
                )}

                {/* Amount Field - Always visible */}
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, color: "text.secondary" }}
                  >
                    Amount ({pairInfo.baseName})
                    {orderKind === OrderKind.TAKE_ORDER && " (0 = full amount)"}
                  </Typography>
                  <TextField
                    fullWidth
                    placeholder={
                      orderKind === OrderKind.TAKE_ORDER
                        ? "0 for full amount"
                        : "0.00"
                    }
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

                {/* Price Field - Only for Limit Orders */}
                {orderKind === OrderKind.LIMIT && (
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
                )}

                {/* Stop Price and Limit Price - Only for Stop Limit Orders */}
                {orderKind === OrderKind.STOP_LIMIT && (
                  <>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, color: "text.secondary" }}
                      >
                        Stop Price ({pairInfo.quoteName} per {pairInfo.baseName}
                        )
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="0.00"
                        type="number"
                        value={stopPrice}
                        onChange={(e) => setStopPrice(e.target.value)}
                        slotProps={{
                          input: {
                            sx: commonStyles.inputFieldStyles,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          color: "text.secondary",
                          display: "block",
                        }}
                      >
                        {tradeType === OrderType.BUY
                          ? "Order triggers when price rises to or above this level"
                          : "Order triggers when price falls to or below this level"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="body2"
                        sx={{ mb: 1, color: "text.secondary" }}
                      >
                        Limit Price ({pairInfo.quoteName} per{" "}
                        {pairInfo.baseName})
                      </Typography>
                      <TextField
                        fullWidth
                        placeholder="0.00"
                        type="number"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        slotProps={{
                          input: {
                            sx: commonStyles.inputFieldStyles,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          mt: 0.5,
                          color: "text.secondary",
                          display: "block",
                        }}
                      >
                        The limit order price after trigger
                      </Typography>
                    </Box>
                  </>
                )}

                {/* Market Order - Best Price Display */}
                {orderKind === OrderKind.MARKET && (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#1e4d2b",
                      borderRadius: "8px",
                      border: "2px solid #10b981",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", color: "#10b981", mb: 1 }}
                    >
                      Best Available Price
                    </Typography>
                    {(() => {
                      const bestOrder =
                        tradeType === OrderType.BUY
                          ? orderBook.sellOrders[0]
                          : orderBook.buyOrders[0];
                      if (!bestOrder) {
                        return (
                          <Typography variant="body2" color="error">
                            No orders available
                          </Typography>
                        );
                      }
                      return (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Price:
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {formatPrice(bestOrder.price)}{" "}
                              {pairInfo.quoteName}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Available:
                            </Typography>
                            <Typography variant="body2" color="text.primary">
                              {formatTokenAmount(
                                bestOrder.amount - bestOrder.filled
                              )}{" "}
                              {pairInfo.baseName}
                            </Typography>
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                )}

                {/* Take Order - Selected Order Display */}
                {orderKind === OrderKind.TAKE_ORDER && selectedOrderId && (
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: "#1e3a5f",
                      borderRadius: "8px",
                      border: "2px solid #3b82f6",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "bold", color: "#3b82f6", mb: 1 }}
                    >
                      Selected Order
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Order ID:
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        #{selectedOrderId.toString()}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        Price:
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {price} {pairInfo.quoteName}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Summary Box */}
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
                      {orderKind === OrderKind.MARKET ||
                      orderKind === OrderKind.TAKE_ORDER
                        ? calculateMarketTotal()
                        : orderKind === OrderKind.STOP_LIMIT && limitPrice
                        ? (
                            parseFloat(amount || "0") * parseFloat(limitPrice)
                          ).toFixed(6)
                        : calculateTotal()}{" "}
                      {pairInfo.quoteName}
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
                    {tradeType === OrderType.SELL
                      ? amount
                      : orderKind === OrderKind.MARKET ||
                        orderKind === OrderKind.TAKE_ORDER
                      ? calculateMarketTotal()
                      : orderKind === OrderKind.STOP_LIMIT && limitPrice
                      ? (
                          parseFloat(amount || "0") * parseFloat(limitPrice)
                        ).toFixed(6)
                      : calculateTotal()}{" "}
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
                      (orderKind === OrderKind.LIMIT && !price) ||
                      (orderKind === OrderKind.TAKE_ORDER &&
                        !selectedOrderId) ||
                      (orderKind === OrderKind.STOP_LIMIT &&
                        (!stopPrice || !limitPrice)) ||
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
                        : orderKind === OrderKind.MARKET
                        ? "Executing Market Order..."
                        : orderKind === OrderKind.TAKE_ORDER
                        ? "Taking Order..."
                        : "Placing Order..."
                      : hasInsufficientBalance()
                      ? "Insufficient Balance"
                      : orderKind === OrderKind.TAKE_ORDER && !selectedOrderId
                      ? "Select Order from Book"
                      : needsApproval()
                      ? `Approve ${
                          tradeType === OrderType.SELL
                            ? pairInfo.baseName
                            : pairInfo.quoteName
                        }`
                      : orderKind === OrderKind.MARKET
                      ? `${
                          tradeType === OrderType.BUY ? "Buy" : "Sell"
                        } at Market`
                      : orderKind === OrderKind.TAKE_ORDER
                      ? `Take ${
                          tradeType === OrderType.BUY ? "Buy" : "Sell"
                        } Order`
                      : orderKind === OrderKind.STOP_LIMIT
                      ? `Place Stop-Limit ${
                          tradeType === OrderType.BUY ? "Buy" : "Sell"
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
