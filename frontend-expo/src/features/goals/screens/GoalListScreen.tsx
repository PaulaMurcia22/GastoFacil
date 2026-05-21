import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../../../theme/colors";
import { appStyles } from "../../app/app.styles";
import { formatCurrency, formatDate } from "../../app/formatters";
import { deleteGoal, fetchGoals } from "../goal.api";
import { GoalItem } from "../goal.types";

interface GoalListScreenProps {
  refreshKey: number;
  onCreateGoal: () => void;
  onOpenGoal: (goalId: string) => void;
  onEditGoal: (goal: GoalItem) => void;
  onDataChanged: () => void;
}

export function GoalListScreen({
  refreshKey,
  onCreateGoal,
  onOpenGoal,
  onEditGoal,
  onDataChanged,
}: GoalListScreenProps) {
  const [items, setItems] = useState<GoalItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const loadGoals = async () => {
      try {
        setIsLoading(true);
        const response = await fetchGoals();

        if (isMounted) {
          setItems(response.items);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "No fue posible cargar las metas.";

        if (isMounted) {
          Alert.alert("Lista no disponible", message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadGoals();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const categoryTabs = useMemo(() => {
    const categoryMap = new Map<string, string>();

    items.forEach((item) => {
      categoryMap.set(item.category.id, item.category.name);
    });

    return [
      { id: "all", label: "Todos" },
      ...Array.from(categoryMap.entries())
        .map(([id, label]) => ({ id, label }))
        .sort((left, right) => left.label.localeCompare(right.label)),
    ];
  }, [items]);

  useEffect(() => {
    const exists = categoryTabs.some((tab) => tab.id === activeCategoryId);

    if (!exists) {
      setActiveCategoryId("all");
    }
  }, [activeCategoryId, categoryTabs]);

  const filteredItems =
    activeCategoryId === "all"
      ? items
      : items.filter((item) => item.category.id === activeCategoryId);

  const handleDelete = (goal: GoalItem) => {
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
                await deleteGoal(goal.id);
                setItems((current) =>
                  current.filter((currentGoal) => currentGoal.id !== goal.id),
                );
                onDataChanged();
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

  return (
    <ScrollView
      contentContainerStyle={appStyles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={appStyles.pageTitle}>Lista de metas</Text>
          <Text style={appStyles.pageSubtitle}>
            Revisa el avance de tus metas y toca una para ver su detalle completo.
          </Text>
        </View>

        <Pressable
          onPress={onCreateGoal}
          style={({ pressed }) => [
            appStyles.buttonPrimary,
            styles.createButton,
            pressed ? appStyles.buttonPrimaryPressed : null,
          ]}
        >
          <Text style={appStyles.buttonPrimaryText}>Nueva</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.tabsRow}
        showsHorizontalScrollIndicator={false}
      >
        {categoryTabs.map((tab) => {
          const isActive = tab.id === activeCategoryId;

          return (
            <Pressable
              key={tab.id}
              onPress={() => {
                setActiveCategoryId(tab.id);
              }}
              style={({ pressed }) => [
                styles.tab,
                isActive ? styles.tabActive : null,
                pressed ? styles.tabPressed : null,
              ]}
            >
              <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <View style={appStyles.centeredState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[appStyles.pageSubtitle, styles.centerText]}>
            Cargando metas...
          </Text>
        </View>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <View style={appStyles.emptyStateCard}>
          <Text style={appStyles.emptyStateTitle}>Aun no tienes metas</Text>
          <Text style={appStyles.emptyStateText}>
            Crea tu primera meta y sigue su progreso desde esta seccion.
          </Text>

          <Pressable
            onPress={onCreateGoal}
            style={({ pressed }) => [
              appStyles.buttonPrimary,
              styles.emptyButton,
              pressed ? appStyles.buttonPrimaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonPrimaryText}>Crear meta</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && items.length > 0 && filteredItems.length === 0 ? (
        <View style={appStyles.emptyStateCard}>
          <Text style={appStyles.emptyStateTitle}>Sin metas en esta categoria</Text>
          <Text style={appStyles.emptyStateText}>
            Cambia de pestana o vuelve a "Todos" para ver mas metas.
          </Text>
        </View>
      ) : null}

      {!isLoading &&
        filteredItems.map((goal) => {
          const progressWidth = `${Math.min(goal.progressPercentage, 100)}%` as const;

          return (
            <Pressable
              key={goal.id}
              onPress={() => {
                onOpenGoal(goal.id);
              }}
              style={({ pressed }) => [
                appStyles.listCard,
                pressed ? appStyles.listCardPressed : null,
              ]}
            >
              <View style={styles.topRow}>
                <Text style={styles.goalTitle}>{goal.name}</Text>
                <Text style={styles.progressValue}>
                  {goal.progressPercentage.toFixed(0)}%
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progressWidth }]} />
              </View>

              <View style={styles.amountsRow}>
                <Text style={appStyles.mutedText}>
                  Ahorrado: {formatCurrency(goal.savedAmount)}
                </Text>
                <Text style={appStyles.mutedText}>
                  Falta: {formatCurrency(goal.remainingAmount)}
                </Text>
              </View>

              <View style={appStyles.tagRow}>
                <View style={appStyles.tagPrimary}>
                  <Text style={appStyles.tagPrimaryText}>{goal.category.name}</Text>
                </View>
                <View style={appStyles.tagNeutral}>
                  <Text style={appStyles.tagNeutralText}>{goal.statusLabel}</Text>
                </View>
              </View>

              {goal.deadline ? (
                <Text style={[appStyles.mutedText, styles.deadlineText]}>
                  Fecha limite: {formatDate(goal.deadline)}
                </Text>
              ) : (
                <Text style={[appStyles.mutedText, styles.deadlineText]}>
                  Fecha limite: Sin definir
                </Text>
              )}

              <View style={styles.actionsRow}>
                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    onEditGoal(goal);
                  }}
                  style={({ pressed }) => [
                    appStyles.buttonSecondary,
                    styles.inlineAction,
                    pressed ? appStyles.buttonSecondaryPressed : null,
                  ]}
                >
                  <Text style={appStyles.buttonSecondaryText}>Editar</Text>
                </Pressable>

                <Pressable
                  onPress={(event) => {
                    event.stopPropagation();
                    handleDelete(goal);
                  }}
                  style={({ pressed }) => [
                    appStyles.buttonGhost,
                    styles.inlineAction,
                    pressed ? appStyles.buttonGhostPressed : null,
                  ]}
                >
                  <Text style={appStyles.buttonGhostText}>Eliminar</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  createButton: {
    minWidth: 92,
  },
  tabsRow: {
    gap: 8,
    paddingVertical: 6,
  },
  tab: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#E8EDF3",
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabPressed: {
    opacity: 0.88,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  centerText: {
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 16,
    alignSelf: "stretch",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  goalTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    paddingRight: 12,
  },
  progressValue: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  progressTrack: {
    marginTop: 12,
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: colors.input,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  amountsRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  deadlineText: {
    marginTop: 12,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  inlineAction: {
    flex: 1,
    minHeight: 42,
  },
});
