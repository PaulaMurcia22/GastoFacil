import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { authStyles } from "../../auth/shared/auth.styles";
import { logoutUser } from "../../auth/screens/home/home.api";
import { type HomeData } from "../../auth/screens/home/home.types";

interface ProfileScreenProps {
  session: HomeData;
  onCloseSession: () => void;
}

export function ProfileScreen({
  session,
  onCloseSession,
}: ProfileScreenProps) {
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
        <Text style={authStyles.homeGreeting}>{session.user.fullName}</Text>
        <Text style={authStyles.helperLink}>{session.user.email}</Text>
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
