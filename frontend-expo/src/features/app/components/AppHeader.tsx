import { Text, View } from "react-native";

import { appStyles } from "../app.styles";

interface AppHeaderProps {
  userName: string;
}

export function AppHeader({ userName }: AppHeaderProps) {
  return (
    <View style={appStyles.header}>
      <View>
        <Text style={appStyles.headerTitle}>Hola, {userName}</Text>
      </View>

      <View style={appStyles.brandBadge}>
        <Text style={appStyles.brandBadgeText}>GF</Text>
      </View>
    </View>
  );
}
