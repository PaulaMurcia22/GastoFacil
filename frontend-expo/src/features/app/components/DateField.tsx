import { useState } from "react";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "../../../theme/colors";
import { appStyles } from "../app.styles";

interface DateFieldProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder: string;
  allowClear?: boolean;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function buildMonthDays(viewDate: Date): Array<Date | null> {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const firstWeekday = firstOfMonth.getDay();
  const mondayFirstOffset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<Date | null> = [];

  for (let i = 0; i < mondayFirstOffset; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

const weekDays = ["L", "M", "Mi", "J", "V", "S", "D"];

export function DateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  allowClear = false,
}: DateFieldProps<TFieldValues>) {
  const [isVisible, setIsVisible] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => {
        const selectedDate = parseDateValue(
          typeof value === "string" ? value : undefined,
        );
        const monthDays = buildMonthDays(viewDate);
        const monthLabel = viewDate.toLocaleDateString("es-CO", {
          month: "long",
          year: "numeric",
        });
        const normalizedMonthLabel =
          monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

        return (
          <View style={styles.wrapper}>
            <Text style={styles.label}>{label}</Text>

            <Pressable
              onPress={() => {
                setViewDate(selectedDate ?? new Date());
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
                  !selectedDate ? styles.placeholderText : null,
                ]}
              >
                {selectedDate ? formatDateValue(selectedDate) : placeholder}
              </Text>
              <Ionicons color={colors.primary} name="calendar-outline" size={18} />
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
                <Pressable style={styles.modalCard}>
                  <View style={styles.monthHeader}>
                    <Pressable
                      onPress={() => {
                        setViewDate(
                          (current) =>
                            new Date(current.getFullYear(), current.getMonth() - 1, 1),
                        );
                      }}
                      style={styles.monthArrow}
                    >
                      <Text style={styles.monthArrowText}>{"<"}</Text>
                    </Pressable>

                    <Text style={styles.monthLabel}>{normalizedMonthLabel}</Text>

                    <Pressable
                      onPress={() => {
                        setViewDate(
                          (current) =>
                            new Date(current.getFullYear(), current.getMonth() + 1, 1),
                        );
                      }}
                      style={styles.monthArrow}
                    >
                      <Text style={styles.monthArrowText}>{">"}</Text>
                    </Pressable>
                  </View>

                  <View style={styles.weekRow}>
                    {weekDays.map((weekDay, index) => (
                      <Text key={`${weekDay}-${index}`} style={styles.weekDayText}>
                        {weekDay}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.daysGrid}>
                    {monthDays.map((day, index) => {
                      if (!day) {
                        return <View key={`empty-${index}`} style={styles.dayCell} />;
                      }

                      const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                      return (
                        <Pressable
                          key={`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`}
                          onPress={() => {
                            onChange(formatDateValue(day));
                            setIsVisible(false);
                          }}
                          style={[
                            styles.dayCell,
                            styles.dayButton,
                            isSelected ? styles.dayButtonSelected : null,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              isSelected ? styles.dayTextSelected : null,
                            ]}
                          >
                            {day.getDate()}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.actionsRow}>
                    {allowClear ? (
                      <Pressable
                        onPress={() => {
                          onChange("");
                          setIsVisible(false);
                        }}
                        style={styles.actionButtonGhost}
                      >
                        <Text style={styles.actionButtonGhostText}>Limpiar</Text>
                      </Pressable>
                    ) : null}

                    <Pressable
                      onPress={() => {
                        onChange(formatDateValue(new Date()));
                        setIsVisible(false);
                      }}
                      style={styles.actionButtonGhost}
                    >
                      <Text style={styles.actionButtonGhostText}>Hoy</Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        setIsVisible(false);
                      }}
                      style={styles.actionButtonPrimary}
                    >
                      <Text style={styles.actionButtonPrimaryText}>Cerrar</Text>
                    </Pressable>
                  </View>
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
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthArrow: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.input,
  },
  monthArrowText: {
    color: colors.primary,
    fontWeight: "800",
  },
  monthLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  weekRow: {
    marginTop: 14,
    flexDirection: "row",
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  daysGrid: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: "14.2857%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  dayButton: {
    borderRadius: 10,
  },
  dayButtonSelected: {
    backgroundColor: colors.primary,
  },
  dayText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  dayTextSelected: {
    color: "#FFFFFF",
  },
  actionsRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionButtonGhost: {
    borderRadius: 12,
    backgroundColor: colors.input,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionButtonGhostText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  actionButtonPrimary: {
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionButtonPrimaryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});
