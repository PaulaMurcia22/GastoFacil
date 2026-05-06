import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useState } from "react";

import { authStyles } from "../../shared/auth.styles";
import { logoutUser } from "./home.api";
import { type HomeData } from "./home.types";

interface HomeScreenProps {
  session: HomeData;
  onCloseSession: () => void;
}

export function HomeScreen({
  session,
  onCloseSession,
}: HomeScreenProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleCloseSession = async () => {
    try {
      setIsClosing(true);
      await logoutUser();
    } finally {
      setIsClosing(false);
      onCloseSession();
    }
  };

  return (
    <View style={authStyles.formCard}>
      <View style={authStyles.homeBox}>
        <Text style={authStyles.homeGreeting}>Hola, {session.user.nickname}</Text>
      </View>

      <Pressable
        disabled={isClosing}
        onPress={() => {
          void handleCloseSession();
        }}
        style={({ pressed }) => [
          authStyles.submitButton,
          pressed ? authStyles.submitButtonPressed : null,
          isClosing ? authStyles.submitButtonDisabled : null,
        ]}
      >
        {isClosing ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.submitButtonText}>Cerrar sesion</Text>
        )}
      </Pressable>
    </View>
  );
}
