import { FC, useState } from "react";
import { InputField } from "../InputField";
import { client } from "../client";
import { Button, StyleSheet, View, Alert, Image } from "react-native";
import { useAuth0 } from "react-native-auth0";

// Utility function to parse JWT token
const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const LoginView: FC = () => {
  const [usedOneTimePasswordMethod, setUsedOneTimePasswordMethod] = useState<
    "email" | "sms" | null
  >(null);

  const { authorize, getCredentials, error, isLoading } = useAuth0();

  const renderContent = () => {
    const onAuth0Login = async () => {
      await authorize({}, {});
      const credentials = await getCredentials();

      if (!credentials?.idToken) {
        Alert.alert("External Auth Error: No credentials found");
        return;
      }

      const parsedIdToken = parseJwt(credentials.idToken);

      await handleExternalLogin({
        externalJwt: credentials?.idToken,
        externalUserId: parsedIdToken?.sub,
      });
    };

    const handleExternalLogin = async ({
      externalJwt,
      externalUserId,
    }: {
      externalJwt: string;
      externalUserId: string;
    }) => {
      await client.auth.external.signInWithExternalJwt({
        externalJwt,
        externalUserId,
      });
    };

    if (usedOneTimePasswordMethod !== null) {
      const onSubmit = (token: string) => {
        if (usedOneTimePasswordMethod === "email") {
          client.auth.email.verifyOTP(token);
        } else if (usedOneTimePasswordMethod === "sms") {
          client.auth.sms.verifyOTP(token);
        }
      };

      return (
        <>
          <InputField key="otp" placeholder="OTP token" onSubmit={onSubmit} />
          <Button
            title="Cancel"
            onPress={() => setUsedOneTimePasswordMethod(null)}
          />
        </>
      );
    }

    return (
      <>
        <InputField
          key="email"
          placeholder="Dynamic Email login"
          onSubmit={(email) =>
            client.auth.email
              .sendOTP(email)
              .then(() => setUsedOneTimePasswordMethod("email"))
          }
        />
        <InputField
          key="sms"
          placeholder="Dynamic US/CA SMS login"
          onSubmit={(phone) =>
            client.auth.sms
              .sendOTP({ dialCode: "1", iso2: "us", phone })
              .then(() => setUsedOneTimePasswordMethod("sms"))
          }
        />
        <Button
          title="Connect with Farcaster"
          onPress={() => client.auth.social.connect({ provider: "farcaster" })}
        />
        <Button
          title="Connect with Google"
          onPress={() => client.auth.social.connect({ provider: "google" })}
        />
        <Button
          onPress={() => client.ui.auth.show()}
          title="Open Auth Flow UI"
        />
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <Button
            onPress={() => onAuth0Login()}
            title="Login with External Auth"
          />
        </View>
      </>
    );
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: "100%",
    minWidth: "100%",
    alignContent: "stretch",
    gap: 40,
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Add a semi-transparent white overlay
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginBottom: 20,
  },
});
