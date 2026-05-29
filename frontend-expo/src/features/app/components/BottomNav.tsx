import { Pressable, Text, View } from "react-native";

import { appStyles } from "../app.styles";
import { BottomNavScreen } from "../app.types";

interface BottomNavProps {
  active: BottomNavScreen;
  onNavigate: (screen: BottomNavScreen) => void;
}

const navItems: Array<{
  id: BottomNavScreen;
  label: string;
  shortLabel: string;
}> = [
  { id: "home", label: "Home", shortLabel: "H" },
  { id: "goal-list", label: "Metas", shortLabel: "M" },
  { id: "income-list", label: "Ingresos", shortLabel: "I" },
  { id: "expense-list", label: "Gastos", shortLabel: "G" },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <View style={appStyles.navBar}>
      {navItems.map((item) => {
        const isActive = item.id === active;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => {
              onNavigate(item.id);
            }}
            style={({ pressed }) => [
              appStyles.navItem,
              isActive ? appStyles.navItemActive : null,
              pressed && !isActive ? { opacity: 0.82 } : null,
            ]}
          >
            <View
              style={[
                appStyles.navIconCircle,
                isActive ? appStyles.navIconCircleActive : null,
              ]}
            >
              <Text
                style={[
                  appStyles.navIconText,
                  isActive ? appStyles.navIconTextActive : null,
                ]}
              >
                {item.shortLabel}
              </Text>
            </View>
            <Text
              style={[
                appStyles.navLabel,
                isActive ? appStyles.navLabelActive : null,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
