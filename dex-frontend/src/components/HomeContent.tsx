"use client";

import { useAccount } from "wagmi";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
} from "@mui/material";
import {
  SwapHoriz,
  Speed,
  Security,
  ViewList,
  Route,
  AccountBalanceWallet,
  TrendingUp,
} from "@mui/icons-material";

// Import styles
import * as homeContentStyles from "@/styles/homeContentStyles";
import * as commonStyles from "@/styles/commonStyles";

export default function HomeContent() {
  const { isConnected } = useAccount();

  return (
    <main className={homeContentStyles.classNames.mainContainer}>
      {/* Hero Section */}
      <section className={homeContentStyles.classNames.heroSection}>
        {/* Background Gradient color*/}
        <div className={homeContentStyles.classNames.heroBackgroundPattern}>
          <div
            className={homeContentStyles.classNames.heroBackgroundGradient1}
          />
          <div
            className={homeContentStyles.classNames.heroBackgroundGradient2}
          />
        </div>

        <Container maxWidth="lg" sx={homeContentStyles.heroContainerStyles}>
          {/* Main Heading */}
          <Typography variant="h1" sx={homeContentStyles.heroTitleStyles}>
            Decentralized Exchange
            <br />
            For Multi-Asset Trading
          </Typography>

          {/* Subtitle */}
          <Typography variant="h5" sx={homeContentStyles.heroSubtitleStyles}>
            Trade wrapped assets, stablecoins, and tokens with an on-chain order
            book. Place limit orders, discover the best prices, and trade
            peer-to-peer with zero intermediaries.
          </Typography>

          {/* Connection Status */}
          {!isConnected ? (
            <Box sx={homeContentStyles.connectionStatusBoxStyles}>
              <Typography
                sx={homeContentStyles.connectionStatusTextStyles.disconnected}
              >
                Please connect your wallet to start trading
              </Typography>
            </Box>
          ) : (
            <Box sx={homeContentStyles.connectionStatusBoxStyles}>
              <Typography
                sx={homeContentStyles.connectionStatusTextStyles.connected}
              >
                Wallet Connected - Ready to trade!
              </Typography>
            </Box>
          )}

          {/* CTA Buttons */}
          <div className={homeContentStyles.classNames.ctaButtonContainer}>
            {isConnected ? (
              <Link href="/market">
                <Button
                  variant="contained"
                  size="large"
                  sx={homeContentStyles.primaryGradientButtonStyles}
                >
                  Start Trading Now
                </Button>
              </Link>
            ) : (
              <div
                className={homeContentStyles.classNames.connectButtonContainer}
              >
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      onClick={openConnectModal}
                      variant="contained"
                      size="large"
                      sx={homeContentStyles.primaryGradientButtonStyles}
                    >
                      Connect Wallet to Start
                    </Button>
                  )}
                </ConnectButton.Custom>
              </div>
            )}
            <Link href="/market">
              <Button
                variant="outlined"
                size="large"
                sx={homeContentStyles.outlinedButtonStyles}
              >
                Explore Order Books
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className={homeContentStyles.classNames.statsGrid}>
            <div className={homeContentStyles.classNames.statsItem}>
              <Typography
                variant="h3"
                sx={homeContentStyles.statsValueStyles.blue}
              >
                $0M+
              </Typography>
              <Typography sx={homeContentStyles.statsLabelStyles}>
                Total Trading Volume
              </Typography>
            </div>
            <div className={homeContentStyles.classNames.statsItem}>
              <Typography
                variant="h3"
                sx={homeContentStyles.statsValueStyles.purple}
              >
                7
              </Typography>
              <Typography sx={homeContentStyles.statsLabelStyles}>
                Trading Pairs
              </Typography>
            </div>
            <div className={homeContentStyles.classNames.statsItem}>
              <Typography
                variant="h3"
                sx={homeContentStyles.statsValueStyles.green}
              >
                0+
              </Typography>
              <Typography sx={homeContentStyles.statsLabelStyles}>
                Active Traders
              </Typography>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section className={homeContentStyles.classNames.featuresSection}>
        <Container maxWidth="lg" sx={homeContentStyles.sectionContainerStyles}>
          <div className={homeContentStyles.classNames.sectionTextCenter}>
            <Typography
              variant="h2"
              sx={{
                ...homeContentStyles.sectionTitleStyles,
                ...commonStyles.commonSpacing.mediumMargin,
              }}
            >
              Why Trade on Our DEX?
            </Typography>
            <Typography
              variant="h6"
              sx={homeContentStyles.sectionSubtitleStyles}
            >
              Built for traders with transparency, security, and full control
            </Typography>
          </div>

          {/* Features Grid */}
          <div className={homeContentStyles.classNames.featuresGrid}>
            {/* On-Chain Order Book */}
            <Card
              sx={{
                ...homeContentStyles.featureCardStyles,
                ...homeContentStyles.featureCardHoverStyles.blue,
              }}
            >
              <CardContent sx={homeContentStyles.cardContentStyles}>
                <div
                  className={
                    homeContentStyles.classNames.featureIconContainer.blue
                  }
                >
                  <SwapHoriz sx={{ color: "white" }} fontSize="large" />
                </div>
                <Typography
                  variant="h5"
                  sx={{
                    ...homeContentStyles.cardTitleStyles,
                    ...commonStyles.commonSpacing.smallMargin,
                  }}
                >
                  On-Chain Order Book
                </Typography>
                <Typography
                  sx={{
                    ...homeContentStyles.cardDescriptionStyles,
                    ...commonStyles.commonSpacing.mediumMargin,
                  }}
                >
                  Trade with a fully decentralized order book. All orders are
                  stored on-chain for complete transparency and trustlessness
                  across multiple asset types.
                </Typography>
                <Link href="/market">
                  <Button
                    variant="outlined"
                    sx={homeContentStyles.featureButtonStyles.blue}
                  >
                    View Order Books
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Secure Trading */}
            <Card
              sx={{
                ...homeContentStyles.featureCardStyles,
                ...homeContentStyles.featureCardHoverStyles.purple,
              }}
            >
              <CardContent sx={homeContentStyles.cardContentStyles}>
                <div
                  className={
                    homeContentStyles.classNames.featureIconContainer.purple
                  }
                >
                  <Security sx={{ color: "white" }} fontSize="large" />
                </div>
                <Typography
                  variant="h5"
                  sx={{
                    ...homeContentStyles.cardTitleStyles,
                    ...commonStyles.commonSpacing.smallMargin,
                  }}
                >
                  Secure & Trustless
                </Typography>
                <Typography
                  sx={{
                    ...homeContentStyles.cardDescriptionStyles,
                    ...commonStyles.commonSpacing.mediumMargin,
                  }}
                >
                  Trade directly from your wallet with no intermediaries. Your
                  funds stay in your control until orders are executed. We
                  ensure maximum security and transparency for transactions.
                </Typography>
                <Link href="/market">
                  <Button
                    variant="outlined"
                    sx={homeContentStyles.featureButtonStyles.purple}
                    disabled={!isConnected}
                  >
                    {isConnected ? "Trade Now" : "Connect Wallet"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Advanced Order Types */}
            <Card
              sx={{
                ...homeContentStyles.featureCardStyles,
                ...homeContentStyles.featureCardHoverStyles.green,
              }}
            >
              <CardContent sx={homeContentStyles.cardContentStyles}>
                <div
                  className={
                    homeContentStyles.classNames.featureIconContainer.green
                  }
                >
                  <TrendingUp sx={{ color: "white" }} fontSize="large" />
                </div>
                <Typography
                  variant="h5"
                  sx={{
                    ...homeContentStyles.cardTitleStyles,
                    ...commonStyles.commonSpacing.smallMargin,
                  }}
                >
                  Advanced Order Types
                </Typography>
                <Typography
                  sx={{
                    ...homeContentStyles.cardDescriptionStyles,
                    ...commonStyles.commonSpacing.mediumMargin,
                  }}
                >
                  Trade with limit orders, market orders, take specific orders,
                  and stop-limit orders. Multiple order types give you precise
                  control over your trading strategy.
                </Typography>
                <Link href="/market">
                  <Button
                    variant="outlined"
                    sx={homeContentStyles.featureButtonStyles.green}
                    disabled={!isConnected}
                  >
                    {isConnected ? "Explore Orders" : "Connect Wallet"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Token Swap Router */}
            <Card
              sx={{
                ...homeContentStyles.featureCardStyles,
                ...homeContentStyles.featureCardHoverStyles.blue,
              }}
            >
              <CardContent sx={homeContentStyles.cardContentStyles}>
                <div
                  className={
                    homeContentStyles.classNames.featureIconContainer.blue
                  }
                >
                  <Route sx={{ color: "white" }} fontSize="large" />
                </div>
                <Typography
                  variant="h5"
                  sx={{
                    ...homeContentStyles.cardTitleStyles,
                    ...commonStyles.commonSpacing.smallMargin,
                  }}
                >
                  Multi-Hop Token Swap
                </Typography>
                <Typography
                  sx={{
                    ...homeContentStyles.cardDescriptionStyles,
                    ...commonStyles.commonSpacing.mediumMargin,
                  }}
                >
                  Swap any token to any other token using intelligent routing.
                  Our pathfinding algorithm finds the best multi-hop route for
                  optimal pricing across trading pairs.
                </Typography>
                <Link href="/token-swap">
                  <Button
                    variant="outlined"
                    sx={homeContentStyles.featureButtonStyles.blue}
                    disabled={!isConnected}
                  >
                    {isConnected ? "Swap Tokens" : "Connect Wallet"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Portfolio Tracker */}
            <Card
              sx={{
                ...homeContentStyles.featureCardStyles,
                ...homeContentStyles.featureCardHoverStyles.purple,
              }}
            >
              <CardContent sx={homeContentStyles.cardContentStyles}>
                <div
                  className={
                    homeContentStyles.classNames.featureIconContainer.purple
                  }
                >
                  <AccountBalanceWallet
                    sx={{ color: "white" }}
                    fontSize="large"
                  />
                </div>
                <Typography
                  variant="h5"
                  sx={{
                    ...homeContentStyles.cardTitleStyles,
                    ...commonStyles.commonSpacing.smallMargin,
                  }}
                >
                  Portfolio Tracker
                </Typography>
                <Typography
                  sx={{
                    ...homeContentStyles.cardDescriptionStyles,
                    ...commonStyles.commonSpacing.mediumMargin,
                  }}
                >
                  Track all your token holdings and total portfolio value in
                  real-time. View balances with live USD valuations based on
                  current market prices from the order book.
                </Typography>
                <Link href="/portfolio">
                  <Button
                    variant="outlined"
                    sx={homeContentStyles.featureButtonStyles.purple}
                    disabled={!isConnected}
                  >
                    {isConnected ? "View Portfolio" : "Connect Wallet"}
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* My Orders Dashboard */}
            <Card
              sx={{
                ...homeContentStyles.featureCardStyles,
                ...homeContentStyles.featureCardHoverStyles.green,
              }}
            >
              <CardContent sx={homeContentStyles.cardContentStyles}>
                <div
                  className={
                    homeContentStyles.classNames.featureIconContainer.green
                  }
                >
                  <ViewList sx={{ color: "white" }} fontSize="large" />
                </div>
                <Typography
                  variant="h5"
                  sx={{
                    ...homeContentStyles.cardTitleStyles,
                    ...commonStyles.commonSpacing.smallMargin,
                  }}
                >
                  My Orders Dashboard
                </Typography>
                <Typography
                  sx={{
                    ...homeContentStyles.cardDescriptionStyles,
                    ...commonStyles.commonSpacing.mediumMargin,
                  }}
                >
                  View all your open orders, buy/sell orders, and trade history
                  in one place. Cancel any order anytime with full control over
                  your trading activity.
                </Typography>
                <Link href="/orders">
                  <Button
                    variant="outlined"
                    sx={homeContentStyles.featureButtonStyles.green}
                    disabled={!isConnected}
                  >
                    {isConnected ? "View My Orders" : "Connect Wallet"}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className={homeContentStyles.classNames.howItWorksSection}>
        <Container maxWidth="lg" sx={homeContentStyles.sectionContainerStyles}>
          <div className={homeContentStyles.classNames.sectionTextCenter}>
            <Typography
              variant="h2"
              sx={{
                ...homeContentStyles.sectionTitleStyles,
                ...commonStyles.commonSpacing.mediumMargin,
              }}
            >
              How It Works
            </Typography>
            <Typography
              variant="h6"
              sx={homeContentStyles.sectionSubtitleStyles}
            >
              Three simple steps to start trading on our decentralized exchange
            </Typography>
          </div>

          <div className={homeContentStyles.classNames.howItWorksGrid}>
            <div className={homeContentStyles.classNames.howItWorksItem}>
              <div
                className={
                  homeContentStyles.classNames.howItWorksStepIcon.step1
                }
              >
                1
              </div>
              <Typography
                variant="h5"
                sx={homeContentStyles.howItWorksStepTitleStyles}
              >
                Connect Wallet
              </Typography>
              <Typography
                sx={homeContentStyles.howItWorksStepDescriptionStyles}
              >
                Connect your Web3 wallet to access the decentralized exchange
                and view live order books.
              </Typography>
            </div>

            <div className={homeContentStyles.classNames.howItWorksItem}>
              <div
                className={
                  homeContentStyles.classNames.howItWorksStepIcon.step2
                }
              >
                2
              </div>
              <Typography
                variant="h5"
                sx={homeContentStyles.howItWorksStepTitleStyles}
              >
                Place Orders
              </Typography>
              <Typography
                sx={homeContentStyles.howItWorksStepDescriptionStyles}
              >
                Choose your trading pair from wrapped assets (WETH, WBTC),
                stablecoins (USDT, USDC, DAI), or other tokens (EIGEN, PEPE),
                set your price, and place limit orders.
              </Typography>
            </div>

            <div className={homeContentStyles.classNames.howItWorksItem}>
              <div
                className={
                  homeContentStyles.classNames.howItWorksStepIcon.step3
                }
              >
                3
              </div>
              <Typography
                variant="h5"
                sx={homeContentStyles.howItWorksStepTitleStyles}
              >
                Execute Trades
              </Typography>
              <Typography
                sx={homeContentStyles.howItWorksStepDescriptionStyles}
              >
                Orders are automatically matched on-chain when prices align.
                Trade securely with full transparency.
              </Typography>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={homeContentStyles.classNames.ctaSection}>
        <Container
          maxWidth="lg"
          sx={homeContentStyles.ctaSectionContainerStyles}
        >
          <Typography variant="h2" sx={homeContentStyles.ctaTitleStyles}>
            Ready to Start Trading?
          </Typography>
          <Typography variant="h6" sx={homeContentStyles.ctaSubtitleStyles}>
            Join the decentralized exchange revolution today
          </Typography>
          <Link href="/market">
            <Button
              variant="contained"
              size="large"
              sx={homeContentStyles.ctaButtonStyles}
              disabled={!isConnected}
            >
              {isConnected ? "Trade Now" : "Connect Wallet First"}
            </Button>
          </Link>
        </Container>
      </section>
    </main>
  );
}
