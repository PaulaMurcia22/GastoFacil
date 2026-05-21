import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FormField } from "../../../components/FormField";
import { appStyles } from "../../app/app.styles";
import { DateField } from "../../app/components/DateField";
import { formatCurrency } from "../../app/formatters";
import { SelectField } from "../../app/components/SelectField";
import { fetchExpenses } from "../../expenses/expense.api";
import { ExpenseItem } from "../../expenses/expense.types";
import { fetchIncomes } from "../../incomes/income.api";
import { IncomeItem } from "../../incomes/income.types";
import { createGoal, fetchGoalCategories, fetchGoals, updateGoal } from "../goal.api";
import { GoalCategory, GoalItem } from "../goal.types";
import { goalSchema, GoalFormValues, toGoalPayload } from "../goal.schema";

interface CreateGoalScreenProps {
  onCancel: () => void;
  onGoalSaved: () => void;
  initialGoal?: GoalItem | null;
}

interface GoalSupportSummary {
  availableMoney: number;
  averageMonthlySaving: number;
}

function buildMonthKey(dateValue: string): string | null {
  const date = new Date(`${dateValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${date.getFullYear()}-${month}`;
}

function sumByMonth(items: Array<{ amount: number; date: string }>): Map<string, number> {
  return items.reduce((accumulator, item) => {
    const monthKey = buildMonthKey(item.date);

    if (!monthKey) {
      return accumulator;
    }

    const current = accumulator.get(monthKey) ?? 0;
    accumulator.set(monthKey, current + item.amount);

    return accumulator;
  }, new Map<string, number>());
}

function buildSupportSummary(
  incomes: IncomeItem[],
  expenses: ExpenseItem[],
  goals: GoalItem[],
): GoalSupportSummary {
  const incomeByMonth = sumByMonth(
    incomes.map((income) => ({ amount: income.amount, date: income.incomeDate })),
  );
  const expenseByMonth = sumByMonth(
    expenses.map((expense) => ({
      amount: expense.amount,
      date: expense.expenseDate,
    })),
  );

  const monthKeys = Array.from(
    new Set([...incomeByMonth.keys(), ...expenseByMonth.keys()]),
  ).sort();
  const latestMonthKeys = monthKeys.slice(-3);
  const monthlyBalances = latestMonthKeys.map((monthKey) => {
    const income = incomeByMonth.get(monthKey) ?? 0;
    const expense = expenseByMonth.get(monthKey) ?? 0;
    return income - expense;
  });
  const totalBalance = monthlyBalances.reduce((sum, amount) => sum + amount, 0);
  const averageMonthlySaving =
    monthlyBalances.length > 0
      ? totalBalance / monthlyBalances.length
      : 0;
  const currentMonth = new Date();
  const currentMonthKey = `${currentMonth.getFullYear()}-${String(
    currentMonth.getMonth() + 1,
  ).padStart(2, "0")}`;
  const currentMonthGoalContributions = goals.reduce(
    (sum, goal) => sum + goal.contributedThisMonth,
    0,
  );
  const availableMoney =
    (incomeByMonth.get(currentMonthKey) ?? 0) -
    (expenseByMonth.get(currentMonthKey) ?? 0) -
    currentMonthGoalContributions;

  return {
    availableMoney,
    averageMonthlySaving: Math.max(averageMonthlySaving, 0),
  };
}

export function CreateGoalScreen({
  onCancel,
  onGoalSaved,
  initialGoal,
}: CreateGoalScreenProps) {
  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [summary, setSummary] = useState<GoalSupportSummary>({
    availableMoney: 0,
    averageMonthlySaving: 0,
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const isEditing = Boolean(initialGoal);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    shouldUnregister: true,
    defaultValues: {
      name: "",
      targetAmount: "",
      categoryId: "",
      deadline: "",
      description: "",
    },
  });

  useEffect(() => {
    if (initialGoal) {
      reset({
        name: initialGoal.name,
        targetAmount: String(initialGoal.targetAmount),
        categoryId: initialGoal.category.id,
        deadline: initialGoal.deadline ?? "",
        description: initialGoal.description ?? "",
      });
      return;
    }

    reset({
      name: "",
      targetAmount: "",
      categoryId: "",
      deadline: "",
      description: "",
    });
  }, [initialGoal, reset]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetchGoalCategories();

        if (isMounted) {
          setCategories(response.items);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar las categorias.";

        if (isMounted) {
          Alert.alert("Categorias no disponibles", message);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    void loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        setIsLoadingSummary(true);
        const [incomeResponse, expenseResponse, goalResponse] = await Promise.all([
          fetchIncomes(),
          fetchExpenses(),
          fetchGoals(),
        ]);

        if (isMounted) {
          setSummary(
            buildSupportSummary(
              incomeResponse.items,
              expenseResponse.items,
              goalResponse.items,
            ),
          );
        }
      } catch {
        if (isMounted) {
          setSummary({
            availableMoney: 0,
            averageMonthlySaving: 0,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false);
        }
      }
    };

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      label: category.name,
      value: category.id,
    }));
  }, [categories]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toGoalPayload(values);

      if (initialGoal) {
        await updateGoal(initialGoal.id, payload);
        Alert.alert(
          "Meta actualizada",
          "Los cambios fueron guardados correctamente.",
        );
      } else {
        await createGoal(payload);
        Alert.alert(
          "Meta registrada",
          "La meta fue guardada y ya aparece en tu lista.",
        );
      }

      onGoalSaved();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible registrar la meta.";

      Alert.alert("Registro no completado", message);
    }
  });

  return (
    <ScrollView
      contentContainerStyle={appStyles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={appStyles.pageTitle}>
        {isEditing ? "Editar meta" : "Registrar meta"}
      </Text>
      <Text style={appStyles.pageSubtitle}>
        {isEditing
          ? "Actualiza los datos de tu meta y guarda los cambios."
          : "Define el monto objetivo y su fecha limite para seguir el progreso."}
      </Text>

      <View style={appStyles.sectionCard}>
        <FormField
          control={control}
          label="Nombre de la meta"
          name="name"
          placeholder="Ej: Viaje de fin de año"
        />

        <FormField
          autoCapitalize="none"
          control={control}
          inputMode="decimal"
          keyboardType="decimal-pad"
          label="Monto objetivo"
          name="targetAmount"
          placeholder="Ej: 1500000"
        />

        <DateField
          allowClear
          control={control}
          label="Fecha limite"
          name="deadline"
          placeholder="Selecciona una fecha (opcional)"
        />

        {isLoadingCategories ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#314A63" />
            <Text style={appStyles.helperText}>Cargando categorias...</Text>
          </View>
        ) : (
          <SelectField
            control={control}
            label="Categoria"
            name="categoryId"
            options={categoryOptions}
            placeholder="Selecciona una categoria"
          />
        )}

        <FormField
          control={control}
          label="Descripcion"
          multiline
          name="description"
          numberOfLines={4}
          placeholder="Opcional. Ej: ahorro para vacaciones familiares"
        />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Dinero disponible este mes</Text>
          {isLoadingSummary ? (
            <ActivityIndicator color="#314A63" />
          ) : (
            <Text style={styles.summaryValue}>
              {formatCurrency(summary.availableMoney)}
            </Text>
          )}
          <Text style={styles.summaryHelper}>
            Promedio de ahorro mensual:{" "}
            {isLoadingSummary
              ? "Calculando..."
              : formatCurrency(summary.averageMonthlySaving)}
          </Text>
        </View>

        <View style={[appStyles.row, styles.actionsRow]}>
          <Pressable
            disabled={isSubmitting}
            onPress={onCancel}
            style={({ pressed }) => [
              appStyles.buttonSecondary,
              styles.flexButton,
              pressed ? appStyles.buttonSecondaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonSecondaryText}>Cancelar</Text>
          </Pressable>

          <Pressable
            disabled={isSubmitting || isLoadingCategories}
            onPress={onSubmit}
            style={({ pressed }) => [
              appStyles.buttonPrimary,
              styles.flexButton,
              pressed ? appStyles.buttonPrimaryPressed : null,
              isSubmitting || isLoadingCategories ? styles.disabledButton : null,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={appStyles.buttonPrimaryText}>
                {isEditing ? "Actualizar" : "Guardar"}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingBox: {
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  summaryBox: {
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: "#EEF2F6",
    padding: 14,
  },
  summaryLabel: {
    color: "#6B7785",
    fontSize: 12,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#223244",
    fontSize: 24,
    fontWeight: "800",
    marginTop: 8,
  },
  summaryHelper: {
    color: "#6B7785",
    fontSize: 12,
    marginTop: 8,
  },
  actionsRow: {
    marginTop: 14,
  },
  flexButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
/*  */