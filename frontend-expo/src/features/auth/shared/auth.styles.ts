import { StyleSheet } from "react-native";

import { colors } from "../../../theme/colors";

export const authStyles = StyleSheet.create({
  formCard: {
    flex: 1,
    marginTop: -12,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 32,
  },
  formTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  formSubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  successBox: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#EAF7EF",
    borderWidth: 1,
    borderColor: "#B8E0C6",
  },
  successTitle: {
    color: colors.success,
    fontWeight: "800",
    marginBottom: 4,
  },
  successMessage: {
    color: colors.text,
    lineHeight: 20,
  },
  homeBox: {
    marginBottom: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeGreeting: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 22,
    textAlign: "center",
  },
  helperLink: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 16,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  submitButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  footerText: {
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 13,
    marginTop: 18,
    lineHeight: 20,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: "700",
  },
});
