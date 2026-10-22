import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { FC } from "react";
import { apiBaseUrl, client } from "../client";
import { Button, ScrollView, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Trade from "./Trade";

export const Swap: FC<{ setCurrentView: (view: string) => void }> = ({
  setCurrentView,
}) => {
  const { auth, sdk } = useReactiveClient(client);

  const jwt = auth.token;

  const {
    data: tokens,
    error: tokensError,
    isLoading: tokensLoading,
  } = useQuery({
    queryKey: ["tokens"] as const,
    queryFn: async () => {
      const tokens = await fetch(
        `${apiBaseUrl}/environments/${auth.authenticatedUser?.environmentId}/tokens`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      ).then((res) => res.json());
      return tokens;
    },
    retry: 3,
    retryDelay: 1000,
    enabled: !!jwt && !!auth.authenticatedUser?.environmentId,
  });
  return (
    <View>
      <Text>Swap</Text>
      <Button onPress={() => setCurrentView("main")} title="Back" />

      <Trade />

      <Text>Tokens:</Text>
      {tokensLoading ? (
        <Text>Loading...</Text>
      ) : tokens?.length > 0 ? (
        <ScrollView>
          {tokens?.map((token: any) => (
            <Text key={token.id}>
              {token.name} ({token.symbol})
            </Text>
          ))}
        </ScrollView>
      ) : (
        <Text>No tokens found</Text>
      )}
    </View>
  );
};
