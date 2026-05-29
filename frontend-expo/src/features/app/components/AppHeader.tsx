import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

import { appStyles } from "../app.styles";

interface AppHeaderProps {
  userName: string;
  onCloseSession: () => void;
}

export function AppHeader({ userName, onCloseSession }: AppHeaderProps) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  return (
    <>
      <View style={appStyles.header}>
        <View>
          <Text style={appStyles.headerTitle}>Hola, {userName}</Text>
        </View>
      </View>
    </>
  );
}
