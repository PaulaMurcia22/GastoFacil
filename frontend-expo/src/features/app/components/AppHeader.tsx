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

        <Pressable
          onPress={() => {
            setIsMenuVisible(true);
          }}
          style={({ pressed }) => [
            appStyles.brandBadge,
            pressed ? appStyles.brandBadgePressed : null,
          ]}
        >
          <Text style={appStyles.brandBadgeText}>GF</Text>
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        onRequestClose={() => {
          setIsMenuVisible(false);
        }}
        transparent
        visible={isMenuVisible}
      >
        <Pressable
          onPress={() => {
            setIsMenuVisible(false);
          }}
          style={appStyles.headerMenuOverlay}
        >
          <View style={appStyles.headerMenuCard}>
            <Pressable
              onPress={() => {
                setIsMenuVisible(false);
                onCloseSession();
              }}
              style={({ pressed }) => [
                appStyles.headerMenuItem,
                pressed ? appStyles.headerMenuItemPressed : null,
              ]}
            >
              <Text style={appStyles.headerMenuItemText}>Cerrar sesion</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
