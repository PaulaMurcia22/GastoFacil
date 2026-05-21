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
import { fetchExpenses } from "../../expenses/expense.api";
import { ExpenseItem } from "../../expenses/expense.types";
import { fetchGoals } from "../../goals/goal.api";
import { GoalItem } from "../../goals/goal.types";
import { fetchIncomes } from "../../incomes/income.api";
import { IncomeItem } from "../../incomes/income.types";
import { appStyles } from "../app.styles";
import { formatCurrency, formatMonthLabel } from "../formatters";

interface HomeDashboardScreenProps {
  refreshKey: number;
}

interface GoalCardState {
  isExpanded: boolean;
}

function buildMonthlySummary(items: IncomeItem[]) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const currentMonthItems = items.filter((item) => {
    const itemDate = new Date(`${item.incomeDate}T00:00:00`);

    return (
      !Number.isNaN(itemDate.getTime()) &&
      itemDate.getFullYear() === year &&
      itemDate.getMonth() === month
    );
  });

  return {
    monthLabel: formatMonthLabel(today),
    monthlyTotal: currentMonthItems.reduce((sum, item) => sum + item.amount, 0),
  };
}

function buildMonthlyExpenseSummary(items: ExpenseItem[]) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const currentMonthItems = items.filter((item) => {
    const itemDate = new Date(`${item.expenseDate}T00:00:00`);

    return (
      !Number.isNaN(itemDate.getTime()) &&
      itemDate.getFullYear() === year &&
      itemDate.getMonth() === month
    );
  });

  return {
    monthLabel: formatMonthLabel(today),
    monthlyTotal: currentMonthItems.reduce((sum, item) => sum + item.amount, 0),
  };
}

export function HomeDashboardScreen({ refreshKey }: HomeDashboardScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);
  const [goalItems, setGoalItems] = useState<GoalItem[]>([]);
  const [goalStateById, setGoalStateById] = useState<Record<string, GoalCardState>>({});

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const [incomeResponse, expenseResponse, goalResponse] = await Promise.all([
          fetchIncomes(),
          fetchExpenses(),
          fetchGoals(),
        ]);

        if (isMounted) {
          setItems(incomeResponse.items);
          setExpenseItems(expenseResponse.items);
          setGoalItems(goalResponse.items);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar tu resumen.";

        if (isMounted) {
          Alert.alert("Resumen no disponible", message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const summary = buildMonthlySummary(items);
  const expenseSummary = buildMonthlyExpenseSummary(expenseItems);
  const currentMonthGoalContributions = goalItems.reduce(
    (sum, goal) => sum + goal.contributedThisMonth,
    0,
  );
  const availableMoney =
    summary.monthlyTotal - expenseSummary.monthlyTotal - currentMonthGoalContributions;
  const activeGoals = useMemo(
    () => goalItems.filter((goal) => goal.status !== "cancelled").slice(0, 3),
    [goalItems],
  );

  return (
    <ScrollView
      contentContainerStyle={appStyles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={appStyles.pageTitle}>Panel principal</Text>
      <Text style={appStyles.pageSubtitle}>
        Desde aqui puedes revisar tus ingresos, gastos y metas.
      </Text>

      <View style={styles.summaryLightCard}>
        <Text style={styles.summaryLightLabel}>Tus ingresos de {summary.monthLabel}</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.summaryLoader} />
        ) : (
          <Text style={styles.summaryLightValue}>
            {formatCurrency(summary.monthlyTotal)}
          </Text>
        )}
      </View>

      <View style={styles.summaryLightCard}>
        <Text style={styles.summaryLightLabel}>Tus gastos de {expenseSummary.monthLabel}</Text>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.summaryLoader} />
        ) : (
          <Text style={styles.summaryLightValue}>
            {formatCurrency(expenseSummary.monthlyTotal)}
          </Text>
        )}
      </View>

      <View style={appStyles.summaryPrimaryCard}>
        <Text style={appStyles.summaryPrimaryLabel}>Tu dinero disponible es</Text>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" style={styles.summaryLoader} />
        ) : (
          <Text style={appStyles.summaryPrimaryValue}>
            {formatCurrency(availableMoney)}
          </Text>
        )}
      </View>

      <View style={appStyles.sectionCard}>
        <Text style={appStyles.sectionTitle}>Tus metas</Text>

        {isLoading ? (
          <View style={styles.loadingGoals}>
            <ActivityIndicator color={colors.primary} />
            <Text style={appStyles.helperText}>Cargando metas...</Text>
          </View>
        ) : null}

        {!isLoading && activeGoals.length === 0 ? (
          <Text style={[appStyles.mutedText, styles.topSpacing]}>
            Aun no tienes metas activas.
          </Text>
        ) : null}

        {!isLoading &&
          activeGoals.map((goal) => {
            const state = goalStateById[goal.id] ?? { isExpanded: false };
            const progressWidth = `${Math.min(goal.progressPercentage, 100)}%` as const;

            return (
              <Pressable
                key={goal.id}
                onPress={() => {
                  setGoalStateById((current) => ({
                    ...current,
                    [goal.id]: { isExpanded: !state.isExpanded },
                  }));
                }}
                style={({ pressed }) => [
                  styles.goalSummaryItem,
                  pressed ? styles.goalSummaryItemPressed : null,
                ]}
              >
                <View style={styles.goalSummaryHeader}>
                  <Text style={styles.goalSummaryTitle}>{goal.name}</Text>
                  <Text style={styles.goalSummaryChevron}>
                    {state.isExpanded ? "^" : "v"}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: progressWidth }]} />
                </View>

                {state.isExpanded ? (
                  <View style={styles.goalSummaryAmounts}>
                    <Text style={styles.goalSummaryAmountLine}>
                      Tu ahorro es de: {formatCurrency(goal.savedAmount)}
                    </Text>
                    <Text style={styles.goalSummaryAmountLine}>
                      Te hace falta: {formatCurrency(goal.remainingAmount)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.goalSummaryPercent}>
                    {goal.progressPercentage.toFixed(0)}%
                  </Text>
                )}
              </Pressable>
            );
          })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryLightCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginTop: 16,
  },
  summaryLightLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  summaryLightValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
  },
  summaryLoader: {
    marginTop: 12,
    alignSelf: "flex-start",
  },
  loadingGoals: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  topSpacing: {
    marginTop: 10,
  },
  goalSummaryItem: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
  },
  goalSummaryItemPressed: {
    backgroundColor: "#F4F7FA",
  },
  goalSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  goalSummaryTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  goalSummaryChevron: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: "700",
  },
  progressTrack: {
    marginTop: 10,
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
  goalSummaryAmounts: {
    marginTop: 10,
    gap: 4,
  },
  goalSummaryAmountLine: {
    color: colors.textMuted,
    fontSize: 14,
  },
  goalSummaryPercent: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
  },
});
