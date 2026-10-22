import { config as lifiConfig } from "@lifi/sdk";
// import { useSyncWagmiConfig } from "@lifi/wallet-management";
import { useQuery } from "@tanstack/react-query";
import { type FC, type PropsWithChildren, useEffect, useState } from "react";
import { Text, View } from "react-native";
import type { Config, CreateConnectorFn } from "wagmi";
import { initializeLiFiConfig, loadLiFiChains } from "./lifi";
import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { client } from "../../client";

interface LiFiProviderProps extends PropsWithChildren {
  wagmiConfig: Config;
  connectors: CreateConnectorFn[];
}

export const LiFiProvider: FC<LiFiProviderProps> = ({
  children,
  wagmiConfig,
  connectors,
}) => {
  const { sdk, wallets, viem } = useReactiveClient(client);
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    data: chains,
    error: chainsError,
    isLoading: chainsLoading,
  } = useQuery({
    queryKey: ["lifi-chains"] as const,
    queryFn: async () => {
      const chains = await loadLiFiChains();
      if (chains.length > 0) {
        lifiConfig.setChains(chains);
      }
      return chains;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: 1000,
    enabled: sdk.loaded,
  });

  useEffect(() => {
    if (sdk.loaded && !isInitialized) {
      try {
        initializeLiFiConfig(wagmiConfig, wallets, viem);
        setIsInitialized(true);
      } catch {
        setIsInitialized(false);
      }
    }
  }, [sdk.loaded, wagmiConfig, isInitialized, wallets.primary]);

  // useSyncWagmiConfig(wagmiConfig, connectors, chains);

  if (chainsLoading || !sdk.loaded || !isInitialized) {
    return (
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100px",
          fontSize: "14px",
          opacity: 0.7,
        }}
      >
        <Text>
          {!sdk.loaded
            ? "Loading Dynamic SDK..."
            : chainsLoading
              ? "Loading LiFi chains..."
              : "Initializing LiFi..."}
        </Text>
      </View>
    );
  }

  if (chainsError) {
    return (
      <View
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100px",
          fontSize: "14px",
          color: "#ef4444",
        }}
      >
        <Text>Failed to load LiFi chains. Please refresh the page.</Text>
      </View>
    );
  }

  return <>{children}</>;
};
