import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../../../theme/colors";
import { appStyles } from "../../app/app.styles";
import { formatCurrency, formatDate } from "../../app/formatters";
import {
  addGoalContribution,
  deleteGoal,
  fetchGoalDetail,
  updateGoalContribution,
} from "../goal.api";
import { GoalDetail, GoalItem } from "../goal.types";

interface GoalDetailScreenProps {
  goalId: string;
  onBackToList: () => void;
  onEditGoal: (goal: GoalItem) => void;
  onGoalDeleted: () => void;
  onDataChanged: () => void;
}

function buildTodayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function GoalDetailScreen({
  goalId,
  onBackToList,
  onEditGoal,
  onGoalDeleted,
  onDataChanged,
}: GoalDetailScreenProps) {
  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contributionAmount, setContributionAmount] = useState("");
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);
  const [contributionError, setContributionError] = useState<string | null>(null);
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [editingContributionAmount, setEditingContributionAmount] = useState("");
  const [isUpdatingContribution, setIsUpdatingContribution] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      try {
        setIsLoading(true);
        const response = await fetchGoalDetail(goalId);

        if (isMounted) {
          setGoal(response.item);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar el detalle.";

        if (isMounted) {
          Alert.alert("Detalle no disponible", message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDetail();

    return () => {
      isMounted = false;
    };
  }, [goalId]);

  const handleContribution = async () => {
    const parsedAmount = Number(contributionAmount.replace(",", "."));

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setContributionError("Ingresa un monto mayor a 0.");
      return;
    }

    try {
      setContributionError(null);
      setIsSubmittingContribution(true);
      const response = await addGoalContribution(goalId, {
        amount: parsedAmount,
        contributionDate: buildTodayValue(),
      });
      setGoal(response.item);
      setContributionAmount("");
      onDataChanged();
      Alert.alert("Aporte registrado", "El aporte fue agregado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible agregar el aporte.";

      if (message.toLowerCase().includes("supera tu dinero disponible")) {
        setContributionError(message);
        return;
      }

      Alert.alert("Aporte no completado", message);
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  const handleStartEditContribution = (contributionId: string, currentAmount: number) => {
    setEditingContributionId(contributionId);
    setEditingContributionAmount(String(currentAmount));
  };

  const handleSaveContributionEdit = async (goalToEdit: GoalDetail) => {
    if (!editingContributionId) {
      return;
    }

    const targetContribution = goalToEdit.contributions.find(
      (item) => item.id === editingContributionId,
    );

    if (!targetContribution) {
      Alert.alert("Aporte no encontrado", "No se encontro el aporte a modificar.");
      return;
    }

    const parsedAmount = Number(editingContributionAmount.replace(",", "."));

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Monto invalido", "Ingresa un monto mayor a 0.");
      return;
    }

    if (parsedAmount > targetContribution.amount) {
      Alert.alert(
        "Solo reduccion permitida",
        "Solo puedes reducir el valor de un aporte ya registrado.",
      );
      return;
    }

    try {
      setIsUpdatingContribution(true);
      const response = await updateGoalContribution(goalId, editingContributionId, {
        amount: parsedAmount,
      });
      setGoal(response.item);
      setEditingContributionId(null);
      setEditingContributionAmount("");
      onDataChanged();
      Alert.alert("Aporte actualizado", "El aporte fue actualizado correctamente.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible actualizar el aporte.";

      Alert.alert("Actualizacion no completada", message);
    } finally {
      setIsUpdatingContribution(false);
    }
  };

  const handleDelete = (goalToDelete: GoalItem) => {
    Alert.alert(
      "Eliminar meta",
      "Deseas eliminar esta meta? Esta accion no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await deleteGoal(goalToDelete.id);
                onGoalDeleted();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "No fue posible eliminar la meta.";

                Alert.alert("Eliminacion no completada", message);
              }
            })();
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View style={appStyles.centeredState}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[appStyles.pageSubtitle, styles.centerText]}>
          Cargando detalle de la meta...
        </Text>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={appStyles.centeredState}>
        <Text style={appStyles.emptyStateTitle}>Meta no encontrada</Text>
        <Text style={appStyles.emptyStateText}>
          No pudimos recuperar la informacion de este registro.
        </Text>
        <Pressable
          onPress={onBackToList}
          style={({ pressed }) => [
            appStyles.buttonPrimary,
            styles.missingAction,
            pressed ? appStyles.buttonPrimaryPressed : null,
          ]}
        >
          <Text style={appStyles.buttonPrimaryText}>Volver a la lista</Text>
        </Pressable>
      </View>
    );
  }

  const progressWidth = `${Math.min(goal.progressPercentage, 100)}%` as const;

  return (
    <ScrollView
      contentContainerStyle={appStyles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topMenu}>
        <Pressable
          onPress={onBackToList}
          style={({ pressed }) => [
            styles.topIconButton,
            pressed ? styles.topIconButtonPressed : null,
          ]}
        >
          <Ionicons color="#FFFFFF" name="arrow-back" size={18} />
        </Pressable>

        <Text style={styles.topMenuTitle}>Detalle de meta</Text>

        <View style={styles.topActions}>
          <Pressable
            onPress={() => {
              onEditGoal(goal);
            }}
            style={({ pressed }) => [
              styles.topIconButton,
              pressed ? styles.topIconButtonPressed : null,
            ]}
          >
            <Ionicons color="#FFFFFF" name="pencil" size={16} />
          </Pressable>

          <Pressable
            onPress={() => {
              handleDelete(goal);
            }}
            style={({ pressed }) => [
              styles.topIconButton,
              pressed ? styles.topIconButtonPressed : null,
            ]}
          >
            <Ionicons color="#FFFFFF" name="trash-outline" size={16} />
          </Pressable>
        </View>
      </View>

      <Text style={appStyles.pageSubtitle}>
        Revisa el avance de tu objetivo y registra nuevos aportes.
      </Text>

      <View style={appStyles.sectionCard}>
        <View style={styles.goalHeader}>
          <Text style={styles.goalTitle}>{goal.name}</Text>
          <Text style={styles.goalProgress}>{goal.progressPercentage.toFixed(0)}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Ahorrado</Text>
            <Text style={styles.metricValue}>{formatCurrency(goal.savedAmount)}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Falta</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(goal.remainingAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Objetivo</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Ahorro mensual sugerido</Text>
            <Text style={styles.metricValue}>
              {goal.monthlyRequiredAmount != null
                ? formatCurrency(goal.monthlyRequiredAmount)
                : "No aplica"}
            </Text>
          </View>
        </View>

        <View style={appStyles.tagRow}>
          <View style={appStyles.tagPrimary}>
            <Text style={appStyles.tagPrimaryText}>{goal.category.name}</Text>
          </View>
          <View style={appStyles.tagNeutral}>
            <Text style={appStyles.tagNeutralText}>{goal.statusLabel}</Text>
          </View>
        </View>

        <Text style={[appStyles.mutedText, styles.deadlineText]}>
          Fecha limite: {goal.deadline ? formatDate(goal.deadline) : "Sin definir"}
        </Text>

        {goal.description ? (
          <Text style={[appStyles.mutedText, styles.descriptionText]}>
            {goal.description}
          </Text>
        ) : null}
      </View>

      <View style={appStyles.sectionCard}>
        <Text style={appStyles.sectionTitle}>Agregar dinero a la meta</Text>

        <View style={styles.contributionRow}>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={(value) => {
              if (contributionError) {
                setContributionError(null);
              }
              setContributionAmount(value);
            }}
            placeholder="Monto del aporte"
            placeholderTextColor={colors.textMuted}
            style={styles.contributionInput}
            value={contributionAmount}
          />

          <Pressable
            disabled={isSubmittingContribution || goal.status === "completed"}
            onPress={() => {
              void handleContribution();
            }}
            style={({ pressed }) => [
              appStyles.buttonPrimary,
              styles.contributionButton,
              pressed ? appStyles.buttonPrimaryPressed : null,
              isSubmittingContribution || goal.status === "completed"
                ? styles.disabledButton
                : null,
            ]}
          >
            {isSubmittingContribution ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={appStyles.buttonPrimaryText}>Agregar</Text>
            )}
          </Pressable>
        </View>
        {contributionError ? (
          <Text style={styles.fieldErrorText}>{contributionError}</Text>
        ) : null}
      </View>

      <View style={appStyles.sectionCard}>
        <Text style={appStyles.sectionTitle}>Historial de aportes</Text>

        {goal.contributions.length === 0 ? (
          <Text style={[appStyles.mutedText, styles.topSpacing]}>
            Aun no tienes aportes en esta meta.
          </Text>
        ) : (
          <View style={styles.contributionList}>
            {goal.contributions.map((contribution) => (
              <View key={contribution.id} style={styles.contributionCard}>
                <View style={styles.contributionItem}>
                  <Text style={appStyles.mutedText}>
                    {formatDate(contribution.contributionDate)}
                  </Text>
                  <Text style={styles.contributionAmount}>
                    +{formatCurrency(contribution.amount)}
                  </Text>
                </View>

                {editingContributionId === contribution.id ? (
                  <View style={styles.editContributionBox}>
                    <TextInput
                      keyboardType="decimal-pad"
                      onChangeText={setEditingContributionAmount}
                      placeholder="Nuevo monto"
                      placeholderTextColor={colors.textMuted}
                      style={styles.editContributionInput}
                      value={editingContributionAmount}
                    />
                    <Pressable
                      disabled={isUpdatingContribution}
                      onPress={() => {
                        void handleSaveContributionEdit(goal);
                      }}
                      style={({ pressed }) => [
                        appStyles.buttonPrimary,
                        styles.editContributionButton,
                        pressed ? appStyles.buttonPrimaryPressed : null,
                        isUpdatingContribution ? styles.disabledButton : null,
                      ]}
                    >
                      {isUpdatingContribution ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={appStyles.buttonPrimaryText}>Guardar</Text>
                      )}
                    </Pressable>
                    <Pressable
                      disabled={isUpdatingContribution}
                      onPress={() => {
                        setEditingContributionId(null);
                        setEditingContributionAmount("");
                      }}
                      style={({ pressed }) => [
                        appStyles.buttonGhost,
                        styles.editContributionButton,
                        pressed ? appStyles.buttonGhostPressed : null,
                      ]}
                    >
                      <Text style={appStyles.buttonGhostText}>Cancelar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={() => {
                      handleStartEditContribution(contribution.id, contribution.amount);
                    }}
                    style={({ pressed }) => [
                      appStyles.buttonGhost,
                      styles.reduceButton,
                      pressed ? appStyles.buttonGhostPressed : null,
                    ]}
                  >
                    <Text style={appStyles.buttonGhostText}>Reducir ahorro</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  topMenu: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  topMenuTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "800",
    flex: 1,
    marginLeft: 12,
  },
  topActions: {
    flexDirection: "row",
    gap: 8,
  },
  topIconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  topIconButtonPressed: {
    opacity: 0.8,
  },
  centerText: {
    textAlign: "center",
  },
  missingAction: {
    marginTop: 16,
    alignSelf: "stretch",
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  goalTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
  },
  goalProgress: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  progressTrack: {
    marginTop: 12,
    height: 10,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.input,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  metricGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: colors.input,
    padding: 10,
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 11,
  },
  metricValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  deadlineText: {
    marginTop: 10,
  },
  descriptionText: {
    marginTop: 10,
  },
  contributionRow: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  contributionInput: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contributionButton: {
    minWidth: 110,
  },
  disabledButton: {
    opacity: 0.7,
  },
  topSpacing: {
    marginTop: 10,
  },
  contributionList: {
    marginTop: 10,
    gap: 10,
  },
  contributionCard: {
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  contributionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  contributionAmount: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  reduceButton: {
    marginTop: 8,
    minHeight: 40,
  },
  editContributionBox: {
    marginTop: 8,
    gap: 8,
  },
  editContributionInput: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
    color: colors.text,
    paddingHorizontal: 12,
  },
  editContributionButton: {
    minHeight: 42,
  },
  fieldErrorText: {
    color: "#C94A4A",
    fontSize: 12,
    marginTop: 8,
  },
});
