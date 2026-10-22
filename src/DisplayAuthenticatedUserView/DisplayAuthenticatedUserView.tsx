import { useReactiveClient } from "@dynamic-labs/react-hooks";
import { FC, useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import nacl_util from "tweetnacl-util";
import { client } from "../client";
import { Wallet } from "@dynamic-labs/client";
import { Swap } from "../Swap";
import { Profile } from "../Profile/Profile";

export const DisplayAuthenticatedUserView: FC = () => {
  const { auth, wallets, passkeys } = useReactiveClient(client);
  const [userPasskeys, setUserPasskeys] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<string>("main");
  const [balances, setBalances] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchUserPasskeys = async () => {
      passkeys.get().then((passkeys) => {
        setUserPasskeys(passkeys);
      });
    };
    fetchUserPasskeys();
  }, [auth]);

  useEffect(() => {
    if (!wallets.primary) return;
    const handleFetchBalances = async () => {
      for (const wallet of wallets.userWallets) {
        if (!wallet) continue;
        await handleGetBalance(wallet);
      }
    };
    handleFetchBalances();
  }, [wallets.userWallets, wallets.primary]);

  const handleSignEVMMessage = async (wallet: Wallet) => {
    const walletClient = await client.viem.createWalletClient({
      wallet,
    });
    await walletClient.signMessage({ message: "gm!" });
  };

  const handleSignSolanaMessage = async (wallet: Wallet) => {
    const message = "gm";
    const messageBytes = nacl_util.decodeUTF8(message);
    const signer = client.solana.getSigner({ wallet });
    await signer.signMessage(messageBytes);
  };

  const handleOpenFundingOptions = async () => {
    await client.ui.fundingOptions.show();
  };

  const handleAddPasskey = async () => {
    const passkey = await client.passkeys.register();
    setUserPasskeys([...userPasskeys, passkey]);
  };

  const handleCopyAddress = async (wallet: Wallet) => {
    await Clipboard.setStringAsync(wallet.address);
  };

  const handleGetBalance = async (wallet: Wallet) => {
    await wallets.switchNetwork({
      wallet,
      chainId: 8453, // base
    });
    const balance = await wallets.getBalance({ wallet });
    setBalances((prev) => ({
      ...prev,
      [wallet.address]: balance?.balance.toString() ?? "0",
    }));
  };

  return (
    <View style={styles.container}>
      {currentView === "main" && (
        <>
          <View style={styles.section}>
            <Text style={styles.section__heading}>User:</Text>
            <View style={styles.content_section}>
              <Text>ID: {auth.authenticatedUser?.userId}</Text>
              <Text>Email: {auth.authenticatedUser?.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.section__heading}>Actions</Text>
            <View style={[styles.content_section, styles.actions_section]}>
              <Button
                onPress={() => client.ui.userProfile.show()}
                title="User Profile UI"
              />
              <Button
                onPress={() => handleOpenFundingOptions()}
                title="Funding Options UI"
              />
              <Button onPress={() => handleAddPasskey()} title="Add Passkey" />
              <Button
                onPress={() => setCurrentView("profile")}
                title="Profile"
              />
              <Button onPress={() => setCurrentView("swap")} title="Swap" />
              <Button onPress={() => client.auth.logout()} title="Logout" />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.section__heading}>Wallets:</Text>
            <View style={styles.content_section}>
              {wallets.userWallets.map((wallet) => (
                <View key={wallet.id} style={styles.wallet_item}>
                  <Text>Wallet address: {wallet.address}</Text>
                  <Text>Chain: {wallet.chain}</Text>
                  <Text>Balance: {balances[wallet.address]}</Text>

                  <Button
                    title="Copy Address"
                    onPress={() => handleCopyAddress(wallet)}
                  />
                  <Button
                    title="Refresh Balance"
                    onPress={() => handleGetBalance(wallet)}
                  />

                  {wallet.chain === "EVM" && (
                    <View style={styles.button_group}>
                      <Button
                        title="Sign message (EVM)"
                        onPress={() => handleSignEVMMessage(wallet)}
                      />
                    </View>
                  )}

                  {wallet.chain === "SOL" && (
                    <View style={styles.button_group}>
                      <Button
                        title="Copy Address"
                        onPress={() => handleCopyAddress(wallet)}
                      />
                      <Button
                        title="Sign message (Solana)"
                        onPress={() => handleSignSolanaMessage(wallet)}
                      />
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.section__heading}>Passkeys:</Text>
            <View style={styles.content_section}>
              {userPasskeys.map((passkey) => (
                <View key={passkey.id} style={styles.wallet_item}>
                  <Text>Passkey ID: {passkey.id}</Text>
                  <Text>Passkey Type: {passkey.type}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
      {currentView === "swap" && <Swap setCurrentView={setCurrentView} />}
      {currentView === "profile" && <Profile setCurrentView={setCurrentView} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignContent: "stretch",
    gap: 40,
    padding: 20,
  },
  section: {
    gap: 5,
  },
  section__heading: {
    fontSize: 14,
    fontWeight: "bold",
  },
  content_section: {
    padding: 10,
    borderRadius: 6,
    backgroundColor: "#f9f9f9",
  },
  actions_section: {
    flexDirection: "column",
    gap: 6,
  },
  wallet_item: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
  },
  button_group: {
    marginTop: 8,
    gap: 8,
  },
});
