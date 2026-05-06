import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

export function BrandHeader() {
  return (
    <View style={styles.container}>
      <View style={[styles.coin, styles.coinLeft]} />
      <View style={[styles.coin, styles.coinRight]} />
      <View style={[styles.coinSmall, styles.coinBottom]} />

      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>GF</Text>
      </View>

      <Text style={styles.title}>
        <Text style={styles.titleLight}>GASTO</Text>
        <Text style={styles.titleAccent}> FACIL</Text>
      </Text>
      <Text style={styles.subtitle}>Toma el control de tus finanzas</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    overflow: "hidden",
  },
  coin: {
    position: "absolute",
    backgroundColor: "rgba(226, 199, 90, 0.22)",
    borderRadius: 999,
  },
  coinLeft: {
    width: 44,
    height: 44,
    left: 22,
    top: 22,
  },
  coinRight: {
    width: 34,
    height: 34,
    right: 30,
    top: 38,
  },
  coinSmall: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(226, 199, 90, 0.18)",
  },
  coinBottom: {
    left: 56,
    bottom: 18,
  },
  logoCircle: {
    width: 82,
    height: 82,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: "rgba(226, 199, 90, 0.45)",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: {
    color: colors.accent,
    fontSize: 26,
    fontWeight: "800",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  titleLight: {
    color: "#FFFFFF",
  },
  titleAccent: {
    color: colors.accent,
  },
  subtitle: {
    marginTop: 6,
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
  },
});
