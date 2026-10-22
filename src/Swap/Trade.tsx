import { useReactiveClient } from "@dynamic-labs/react-hooks";
import {
  executeRoute,
  getActiveRoutes,
  getChains,
  getRoutes,
  getTokens,
  resumeRoute,
  stopRouteExecution,
  updateRouteExecution,
  type ExecutionOptions,
  type Route,
  type RouteExtended,
  type Token,
} from "@lifi/sdk";
import { useEffect, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";

import TradeForm from "./TradeForm";
import { client } from "../client";
import ActionButtons from "./ActionButtons";
import RouteDisplay from "./RouteDisplay";
import StatusMessages from "./StatusMessages";
import ExecutionControl from "./ExecutionControl";
import { ExecutionProgress } from "./ExecutionProgress";

interface SimpleChain {
  id: number;
  name: string;
}

interface SwapState {
  fromChain: SimpleChain | null;
  toChain: SimpleChain | null;
  fromToken: Token | null;
  toToken: Token | null;
  amount: string;
  routes: Route[];
  selectedRoute: Route | null;
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  isExecuting: boolean;
  executionProgress: ExecutionProgress[];
  activeRoute: RouteExtended | null;
  isRouteCompleted: boolean;
}

interface ExecutionProgress {
  stepIndex: number;
  stepType: string;
  status: string;
  txHash?: string;
  explorerLink?: string;
  chainId?: number;
  message: string;
}

const LoadingSpinner = () => (
  <View style={styles.spinnerContainer}>
    <View style={styles.spinner} />
  </View>
);

const LockIcon = () => (
  <Svg
    style={styles.lockIcon}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <Path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </Svg>
);

export default function Trade() {
  const { wallets, sdk } = useReactiveClient(client);

  const isConnected = !!wallets.primary;
  const address = wallets.primary?.address;
  const isReady = sdk.loaded && isConnected && !!address;

  const [swapState, setSwapState] = useState<SwapState>({
    fromChain: null,
    toChain: null,
    fromToken: null,
    toToken: null,
    amount: "0.000001",
    routes: [],
    selectedRoute: null,
    isLoading: false,
    error: null,
    txHash: null,
    isExecuting: false,
    executionProgress: [],
    activeRoute: null,
    isRouteCompleted: false,
  });

  const [chains, setChains] = useState<SimpleChain[]>([]);
  const [fromTokens, setFromTokens] = useState<Token[]>([]);
  const [toTokens, setToTokens] = useState<Token[]>([]);
  const [isLoadingChains, setIsLoadingChains] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    const checkActiveRoutes = () => {
      try {
        const activeRoutes = getActiveRoutes();
        if (activeRoutes.length > 0) {
          const route = activeRoutes[0];
          setSwapState((prev) => ({
            ...prev,
            activeRoute: route,
            isExecuting: true,
          }));
          monitorRouteExecution(route);
        }
      } catch {
        setSwapState((prev) => ({
          ...prev,
          error: "Failed to check active routes",
        }));
      }
    };

    checkActiveRoutes();
  }, [isReady]);

  useEffect(() => {
    if (!isReady) return;

    const fetchChains = async () => {
      setIsLoadingChains(true);
      try {
        const availableChains = await getChains();
        const simpleChains: SimpleChain[] = availableChains.map((chain) => ({
          id: chain.id,
          name: chain.name,
        }));
        setChains(simpleChains);

        if (simpleChains.length >= 2) {
          setSwapState((prev) => ({
            ...prev,
            fromChain: simpleChains[0],
            toChain: simpleChains[1],
          }));
        }
      } catch {
        setSwapState((prev) => ({
          ...prev,
          error: "Failed to fetch available chains",
        }));
      } finally {
        setIsLoadingChains(false);
      }
    };

    fetchChains();
  }, [isReady]);

  useEffect(() => {
    if (!swapState.fromChain || !swapState.toChain || !isReady) return;

    const fetchTokens = async () => {
      setIsLoadingTokens(true);
      try {
        const fromChainId = swapState.fromChain?.id;
        const toChainId = swapState.toChain?.id;

        if (!fromChainId || !toChainId) return;

        const [fromTokensResponse, toTokensResponse] = await Promise.all([
          getTokens({ chains: [fromChainId] }),
          getTokens({ chains: [toChainId] }),
        ]);

        const fromTokensList = fromTokensResponse.tokens[fromChainId] || [];
        const toTokensList = toTokensResponse.tokens[toChainId] || [];

        setFromTokens(fromTokensList);
        setToTokens(toTokensList);

        if (fromTokensList.length > 0) {
          setSwapState((prev) => ({ ...prev, fromToken: fromTokensList[0] }));
        }
        if (toTokensList.length > 0) {
          setSwapState((prev) => ({ ...prev, toToken: toTokensList[0] }));
        }
      } catch {
        setSwapState((prev) => ({
          ...prev,
          error: "Failed to fetch available tokens",
        }));
      } finally {
        setIsLoadingTokens(false);
      }
    };

    fetchTokens();
  }, [swapState.fromChain, swapState.toChain, isReady]);

  const switchToChain = async (chainId: number) => {
    if (!wallets.primary) {
      return;
    }

    try {
      await wallets.switchNetwork({
        wallet: wallets.primary,
        chainId: chainId,
      });
    } catch (error) {
      throw error;
    }
  };

  const getRoutesForSwap = async (
    fromChainId: number,
    toChainId: number,
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
  ) => {
    if (!sdk.loaded || !isConnected || !address) {
      throw new Error("Not ready");
    }

    try {
      const routes = await getRoutes({
        fromChainId,
        toChainId,
        fromTokenAddress,
        toTokenAddress,
        fromAmount: amount,
        fromAddress: address,
        toAddress: address,
        options: {
          order: "CHEAPEST",
          maxPriceImpact: 0.3,
          slippage: 0.005,
          fee: 0.01, // 1% fee
        },
      });

      return routes;
    } catch (error) {
      throw error;
    }
  };

  const monitorRouteExecution = (route: RouteExtended) => {
    const progress: ExecutionProgress[] = [];

    route.steps.forEach((step, stepIndex) => {
      if (step.execution?.process) {
        step.execution.process.forEach((process) => {
          let chainId: number | undefined;

          if (stepIndex === 0) {
            chainId = swapState.fromChain?.id;
          } else if (stepIndex === route.steps.length - 1) {
            chainId = swapState.toChain?.id;
          } else {
            chainId = swapState.toChain?.id;
          }

          progress.push({
            stepIndex,
            stepType: process.type,
            status: process.status,
            txHash: process.txHash,
            explorerLink: process.explorerLink,
            chainId,
            message: `${process.type}: ${process.status}`,
          });
        });
      }
    });

    setSwapState((prev) => ({
      ...prev,
      executionProgress: progress,
      activeRoute: route,
    }));
  };

  const executeSwapRoute = async (route: Route) => {
    if (!sdk.loaded || !isConnected || !address || !route) {
      throw new Error("Not ready");
    }

    try {
      const executionOptions: ExecutionOptions = {
        updateRouteHook: (updatedRoute: RouteExtended) => {
          monitorRouteExecution(updatedRoute);

          const isComplete = updatedRoute.steps.every(
            (step) =>
              step.execution?.status === "DONE" ||
              step.execution?.status === "FAILED",
          );

          if (isComplete) {
            setSwapState((prev) => ({
              ...prev,
              isExecuting: false,
              txHash: "Execution completed",
              isRouteCompleted: true,
              activeRoute: null,
            }));
          }
        },
        updateTransactionRequestHook: async (txRequest) => {
          return txRequest;
        },
        acceptExchangeRateUpdateHook: async (params) => {
          const accepted = window.confirm(
            `Exchange rate has changed!\nOld amount: ${formatUnits(
              BigInt(params.oldToAmount),
              params.toToken.decimals,
            )} ${params.toToken.symbol}\nNew amount: ${formatUnits(
              BigInt(params.newToAmount),
              params.toToken.decimals,
            )} ${params.toToken.symbol}\n\nDo you want to continue?`,
          );
          return accepted;
        },
        switchChainHook: async (chainId) => {
          try {
            await switchToChain(chainId);
            return undefined;
          } catch (error) {
            throw error;
          }
        },
        executeInBackground: false,
        disableMessageSigning: false,
      };

      const result = await executeRoute(route, executionOptions);
      return result;
    } catch (error) {
      throw error;
    }
  };

  const handleGetRoutes = async () => {
    if (
      !swapState.fromChain ||
      !swapState.toChain ||
      !swapState.fromToken ||
      !swapState.toToken ||
      !swapState.amount ||
      !isConnected
    ) {
      setSwapState((prev) => ({
        ...prev,
        error: "Please fill in all required fields and connect wallet",
      }));
      return;
    }

    setSwapState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      routes: [],
      selectedRoute: null,
    }));

    try {
      const amountInWei = parseUnits(
        swapState.amount,
        swapState.fromToken.decimals,
      );

      const routesResult = await getRoutesForSwap(
        swapState.fromChain.id,
        swapState.toChain.id,
        swapState.fromToken.address,
        swapState.toToken.address,
        amountInWei.toString(),
      );

      const availableRoutes = routesResult.routes || [];
      setSwapState((prev) => ({
        ...prev,
        routes: availableRoutes,
        selectedRoute: availableRoutes[0] || null,
        isLoading: false,
        error: availableRoutes.length === 0 ? "No routes found" : null,
      }));
    } catch (error) {
      setSwapState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to get routes",
        isLoading: false,
      }));
    }
  };

  const handleExecuteSwap = async () => {
    if (!swapState.selectedRoute || !isConnected) {
      setSwapState((prev) => ({
        ...prev,
        error: "No route selected or wallet not connected",
      }));
      return;
    }

    setSwapState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      txHash: null,
      isExecuting: true,
      executionProgress: [],
    }));

    try {
      await executeSwapRoute(swapState.selectedRoute);
      setSwapState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error) {
      setSwapState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to execute swap",
        isLoading: false,
        isExecuting: false,
      }));
    }
  };

  const handleResumeRoute = async () => {
    if (!swapState.activeRoute) return;

    try {
      setSwapState((prev) => ({ ...prev, isLoading: true }));
      await resumeRoute(swapState.activeRoute);
      setSwapState((prev) => ({ ...prev, isLoading: false }));
    } catch (error) {
      setSwapState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to resume route",
        isLoading: false,
      }));
    }
  };

  const handleStopRoute = () => {
    if (!swapState.activeRoute) return;

    try {
      stopRouteExecution(swapState.activeRoute);
      setSwapState((prev) => ({
        ...prev,
        isExecuting: false,
        activeRoute: null,
        executionProgress: [],
      }));
    } catch {
      setSwapState((prev) => ({
        ...prev,
        error: "Failed to stop route execution",
      }));
    }
  };

  const handleMoveToBackground = () => {
    if (!swapState.activeRoute) return;

    try {
      updateRouteExecution(swapState.activeRoute, {
        executeInBackground: true,
      });
      setSwapState((prev) => ({
        ...prev,
        isExecuting: false,
      }));
    } catch {
      setSwapState((prev) => ({
        ...prev,
        error: "Failed to move route to background",
      }));
    }
  };

  const clearState = () => {
    setSwapState((prev) => ({
      ...prev,
      routes: [],
      selectedRoute: null,
      error: null,
      txHash: null,
      executionProgress: [],
      activeRoute: null,
      isRouteCompleted: false,
    }));
  };

  const isFormValid = !!(
    swapState.fromChain &&
    swapState.toChain &&
    swapState.fromToken &&
    swapState.toToken &&
    swapState.amount &&
    isConnected
  );

  if (!sdk.loaded) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.loadingContainer}>
          <View style={styles.spinnerWrapper}>
            <LoadingSpinner />
          </View>
          <Text style={styles.loadingText}>Loading wallet connection...</Text>
        </View>
      </ScrollView>
    );
  }

  if (!isConnected) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.connectContainer}>
          <View style={styles.lockIconWrapper}>
            <LockIcon />
          </View>
          <Text style={styles.connectTitle}>Connect Your Wallet</Text>
          <Text style={styles.connectDescription}>
            Please connect your wallet to use the multi-chain swap feature.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <TradeForm
        fromChain={swapState.fromChain}
        toChain={swapState.toChain}
        fromToken={swapState.fromToken}
        toToken={swapState.toToken}
        amount={swapState.amount}
        chains={chains}
        fromTokens={fromTokens}
        toTokens={toTokens}
        isLoadingChains={isLoadingChains}
        isLoadingTokens={isLoadingTokens}
        onFromChainChange={(chain) =>
          setSwapState((prev) => ({
            ...prev,
            fromChain: chain,
            fromToken: null,
          }))
        }
        onToChainChange={(chain) =>
          setSwapState((prev) => ({
            ...prev,
            toChain: chain,
            toToken: null,
          }))
        }
        onFromTokenChange={(token) =>
          setSwapState((prev) => ({
            ...prev,
            fromToken: token,
          }))
        }
        onToTokenChange={(token) =>
          setSwapState((prev) => ({
            ...prev,
            toToken: token,
          }))
        }
        onAmountChange={(amount) =>
          setSwapState((prev) => ({
            ...prev,
            amount,
          }))
        }
      />

      <ActionButtons
        isLoading={swapState.isLoading}
        isExecuting={swapState.isExecuting}
        hasRoutes={swapState.routes.length > 0}
        hasSelectedRoute={!!swapState.selectedRoute}
        isFormValid={isFormValid}
        onGetRoutes={handleGetRoutes}
        onExecuteSwap={handleExecuteSwap}
        onClear={clearState}
      />

      <StatusMessages
        error={swapState.error}
        txHash={swapState.txHash}
        chainId={swapState.fromChain?.id}
      />

      <ExecutionControl
        activeRoute={swapState.activeRoute}
        isExecuting={swapState.isExecuting}
        isRouteCompleted={swapState.isRouteCompleted}
        onResumeRoute={handleResumeRoute}
        onMoveToBackground={handleMoveToBackground}
        onStopRoute={handleStopRoute}
      />

      <ExecutionProgress executionProgress={swapState.executionProgress} />

      <RouteDisplay
        routes={swapState.routes}
        selectedRoute={swapState.selectedRoute}
        toTokenSymbol={swapState.toToken?.symbol}
        onRouteSelect={(route) =>
          setSwapState((prev) => ({
            ...prev,
            selectedRoute: route,
          }))
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC", // gradient equivalent
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 8,
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 80,
  },
  spinnerWrapper: {
    width: 64,
    height: 64,
    backgroundColor: "#3B82F6",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  spinnerContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    width: 32,
    height: 32,
    borderWidth: 2,
    borderColor: "white",
    borderTopColor: "transparent",
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 20,
    color: "#4B5563",
  },
  connectContainer: {
    alignItems: "center",
    paddingVertical: 80,
  },
  lockIconWrapper: {
    width: 64,
    height: 64,
    backgroundColor: "#D1D5DB",
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  lockIcon: {
    width: 32,
    height: 32,
    color: "#4B5563",
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  connectDescription: {
    color: "#4B5563",
    marginBottom: 32,
    textAlign: "center",
  },
});
