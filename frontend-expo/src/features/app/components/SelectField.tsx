import { useMemo, useState } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../../theme/colors";
import { appStyles } from "../app.styles";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  options: SelectOption[];
}

export function SelectField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
}: SelectFieldProps<TFieldValues>) {
  const [isVisible, setIsVisible] = useState(false);

  const optionsByValue = useMemo(() => {
    return new Map(options.map((option) => [option.value, option.label]));
  }, [options]);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedLabel =
          typeof value === "string" ? optionsByValue.get(value) : undefined;

        return (
          <View style={styles.wrapper}>
            <Text style={styles.label}>{label}</Text>

            <Pressable
              onPress={() => {
                setIsVisible(true);
              }}
              style={({ pressed }) => [
                styles.fieldShell,
                error ? styles.fieldShellError : null,
                pressed ? styles.fieldShellPressed : null,
              ]}
            >
              <Text
                style={[
                  styles.valueText,
                  !selectedLabel ? styles.placeholderText : null,
                ]}
              >
                {selectedLabel ?? placeholder}
              </Text>
              <Text style={styles.chevronText}>v</Text>
            </Pressable>

            {error ? <Text style={styles.errorText}>{error.message}</Text> : null}

            <Modal
              animationType="fade"
              onRequestClose={() => {
                setIsVisible(false);
              }}
              transparent
              visible={isVisible}
            >
              <Pressable
                onPress={() => {
                  setIsVisible(false);
                }}
                style={appStyles.modalOverlay}
              >
                <Pressable style={appStyles.modalCard}>
                  <Text style={appStyles.modalTitle}>{label}</Text>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {options.map((option) => {
                      const isSelected = option.value === value;

                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => {
                            onChange(option.value);
                            setIsVisible(false);
                          }}
                          style={[
                            appStyles.modalOption,
                            isSelected ? appStyles.modalOptionSelected : null,
                          ]}
                        >
                          <Text style={appStyles.modalOptionText}>
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </Modal>
          </View>
        );
      }}
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
  fieldShell: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldShellPressed: {
    backgroundColor: "#E7EDF4",
  },
  fieldShellError: {
    borderColor: colors.danger,
  },
  valueText: {
    color: colors.text,
    fontSize: 15,
    flex: 1,
    paddingRight: 12,
  },
  placeholderText: {
    color: colors.textMuted,
  },
  chevronText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
});
