import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { appStyles } from "../app.styles";
import { formatCurrency, formatMonthLabel } from "../formatters";
import { fetchIncomes } from "../../incomes/income.api";
import { IncomeItem } from "../../incomes/income.types";
import { fetchExpenses } from "../../expenses/expense.api";
import { ExpenseItem } from "../../expenses/expense.types";
import { colors } from "../../../theme/colors";

interface HomeDashboardScreenProps {
  refreshKey: number;
  onGoToIncomeList: () => void;
  onGoToExpenseList: () => void;
  onCloseSession: () => void;
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
    latestIncome: items[0] ?? null,
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
    latestExpense: items[0] ?? null,
  };
}

export function HomeDashboardScreen({
  refreshKey,
  onGoToIncomeList,
  onGoToExpenseList,
  onCloseSession,
}: HomeDashboardScreenProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setIsLoading(true);
        const [incomeResponse, expenseResponse] = await Promise.all([
          fetchIncomes(),
          fetchExpenses(),
        ]);

        if (isMounted) {
          setItems(incomeResponse.items);
          setExpenseItems(expenseResponse.items);
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
  const availableMoney = summary.monthlyTotal - expenseSummary.monthlyTotal;

  return (
    <ScrollView
      contentContainerStyle={appStyles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={appStyles.pageTitle}>Panel principal</Text>
      <Text style={appStyles.pageSubtitle}>
        Desde aqui puedes revisar tus ingresos, gastos y metas.
      </Text>

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

      <View style={appStyles.summaryPrimaryCard}>
        <Text style={appStyles.summaryPrimaryLabel}>
          Tus ingresos de {summary.monthLabel}
        </Text>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" style={styles.summaryLoader} />
        ) : (
          <Text style={appStyles.summaryPrimaryValue}>
            {formatCurrency(summary.monthlyTotal)}
          </Text>
        )}
      </View>

      <View style={appStyles.summaryPrimaryCard}>
        <Text style={appStyles.summaryPrimaryLabel}>
          Tus gastos de {expenseSummary.monthLabel}
        </Text>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" style={styles.summaryLoader} />
        ) : (
          <Text style={appStyles.summaryPrimaryValue}>
            {formatCurrency(expenseSummary.monthlyTotal)}
          </Text>
        )}
      </View>

      <View style={appStyles.row}>
        <View style={[appStyles.sectionCard, styles.flexCard]}>
          <Text style={appStyles.sectionLabel}>Ultimo ingreso</Text>
          <Text style={styles.cardMetricSmall}>
            {summary.latestIncome
              ? formatCurrency(summary.latestIncome.amount)
              : "Sin datos"}
          </Text>
        </View>

        <View style={[appStyles.sectionCard, styles.flexCard]}>
          <Text style={appStyles.sectionLabel}>Ultimo gasto</Text>
          <Text style={styles.cardMetricSmall}>
            {expenseSummary.latestExpense
              ? formatCurrency(expenseSummary.latestExpense.amount)
              : "Sin datos"}
          </Text>
        </View>
      </View>

      {/* <View style={appStyles.sectionCard}>
        <Text style={appStyles.sectionTitle}>Accesos rapidos</Text>
        <Text style={appStyles.pageSubtitle}>
          Entra directo a tus listas de ingresos y gastos.
        </Text>

        <View style={[appStyles.row, styles.topSpacing]}>
          <Pressable
            onPress={onGoToIncomeList}
            style={({ pressed }) => [
              appStyles.buttonSecondary,
              styles.flexCard,
              pressed ? appStyles.buttonSecondaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonSecondaryText}>Ir a ingresos</Text>
          </Pressable>

          <Pressable
            onPress={onGoToExpenseList}
            style={({ pressed }) => [
              appStyles.buttonSecondary,
              styles.flexCard,
              pressed ? appStyles.buttonSecondaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonSecondaryText}>Ir a gastos</Text>
          </Pressable>
        </View>
      </View> */}
      <Pressable
        onPress={onCloseSession}
        style={({ pressed }) => [
          appStyles.buttonGhost,
          styles.topSpacingSmall,
          pressed ? appStyles.buttonGhostPressed : null,
        ]}
      >
        <Text style={appStyles.buttonGhostText}>Cerrar sesion</Text>
      </Pressable>

      {/* <View style={appStyles.sectionCard}>
        <Text style={appStyles.sectionTitle}>Accesos rapidos</Text>
        <Text style={appStyles.pageSubtitle}>
          El menu inferior ya te lleva directo a ingresos, y aqui te dejamos el
          acceso principal del flujo.
        </Text>

        <Pressable
          onPress={onGoToIncomeList}
          style={({ pressed }) => [
            appStyles.buttonPrimary,
            styles.topSpacing,
            pressed ? appStyles.buttonPrimaryPressed : null,
          ]}
        >
          <Text style={appStyles.buttonPrimaryText}>Ir a lista de ingresos</Text>
        </Pressable>

        
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  summaryLoader: {
    marginTop: 14,
    alignSelf: "flex-start",
  },
  flexCard: {
    flex: 1,
  },
  cardMetric: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  cardMetricSmall: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  topSpacing: {
    marginTop: 16,
  },
  topSpacingSmall: {
    marginTop: 10,
  },
});
