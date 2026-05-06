import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";

import { colors } from "../theme/colors";

interface FormFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  secureTextEntry?: boolean;
  inputMode?: TextInputProps["inputMode"];
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  showToggle?: boolean;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export function FormField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
  inputMode,
  keyboardType,
  autoCapitalize = "sentences",
  showToggle = false,
  isVisible = false,
  onToggleVisibility,
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onBlur, onChange, value }, fieldState: { error } }) => (
        <View style={styles.wrapper}>
          <Text style={styles.label}>{label}</Text>

          <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
            <TextInput
              autoCapitalize={autoCapitalize}
              inputMode={inputMode}
              keyboardType={keyboardType}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              secureTextEntry={secureTextEntry && !isVisible}
              style={styles.input}
              value={String(value ?? "")}
            />

            {showToggle ? (
              <Pressable onPress={onToggleVisibility} style={styles.toggleButton}>
                <Text style={styles.toggleText}>{isVisible ? "Ocultar" : "Mostrar"}</Text>
              </Pressable>
            ) : null}
          </View>

          {error ? <Text style={styles.errorText}>{error.message}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputShell: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
    flexDirection: "row",
    alignItems: "center",
  },
  inputShellError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  toggleButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  toggleText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 12,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
});
