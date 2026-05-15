import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { SelectField } from "../../app/components/SelectField";
import {
  createExpense,
  fetchExpenseCategories,
  updateExpense,
} from "../expense.api";
import {
  expenseSchema,
  type ExpenseFormValues,
  toExpensePayload,
} from "../expense.schema";
import { ExpenseCategory, type ExpenseItem } from "../expense.types";

interface CreateExpenseScreenProps {
  onCancel: () => void;
  onExpenseSaved: () => void;
  initialExpense?: ExpenseItem | null;
}

const expenseTypeOptions = [
  { label: "Fijo", value: "fixed" },
  { label: "Variable", value: "variable" },
  { label: "Una sola vez", value: "one_time" },
];

function buildTodayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreateExpenseScreen({
  onCancel,
  onExpenseSaved,
  initialExpense,
}: CreateExpenseScreenProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const isEditing = Boolean(initialExpense);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    shouldUnregister: true,
    defaultValues: {
      amount: "",
      expenseDate: buildTodayValue(),
      categoryId: "",
      expenseType: "variable",
      frequencyMonths: "3",
      description: "",
    },
  });

  const expenseType = useWatch({ control, name: "expenseType" });

  useEffect(() => {
    if (initialExpense) {
      reset({
        amount: String(initialExpense.amount),
        expenseDate: initialExpense.expenseDate,
        categoryId: initialExpense.category.id,
        expenseType: initialExpense.expenseType,
        frequencyMonths: initialExpense.frequencyMonths
          ? String(initialExpense.frequencyMonths)
          : "",
        description: initialExpense.description ?? "",
      });
      return;
    }

    reset({
      amount: "",
      expenseDate: buildTodayValue(),
      categoryId: "",
      expenseType: "variable",
      frequencyMonths: "3",
      description: "",
    });
  }, [initialExpense, reset]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetchExpenseCategories();

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

  const categoryOptions = useMemo(() => {
    return categories.map((category) => ({
      label: category.name,
      value: category.id,
    }));
  }, [categories]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const payload = toExpensePayload(values);

      if (initialExpense) {
        await updateExpense(initialExpense.id, payload);
        Alert.alert(
          "Gasto actualizado",
          "Los cambios fueron guardados correctamente.",
        );
      } else {
        await createExpense(payload);
        Alert.alert(
          "Gasto registrado",
          "El gasto fue guardado y ya aparece en tu lista.",
        );
      }

      onExpenseSaved();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible registrar el gasto.";

      Alert.alert("Registro no completado", message);
    }
  });

  return (
    <ScrollView
      contentContainerStyle={appStyles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={appStyles.pageTitle}>
        {isEditing ? "Editar gasto" : "Registrar gasto"}
      </Text>
      <Text style={appStyles.pageSubtitle}>
        {isEditing
          ? "Actualiza los datos del gasto y guarda los cambios en tu historial."
          : "Completa los datos principales del dinero salido y guárdalo en tu historial."}
      </Text>

      <View style={appStyles.sectionCard}>
        <FormField
          autoCapitalize="none"
          control={control}
          inputMode="decimal"
          keyboardType="decimal-pad"
          label="Monto"
          name="amount"
          placeholder="Ej: 500000"
        />

        <FormField
          autoCapitalize="none"
          control={control}
          label="Fecha"
          name="expenseDate"
          placeholder="YYYY-MM-DD"
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

        <SelectField
          control={control}
          label="Tipo de gasto"
          name="expenseType"
          options={expenseTypeOptions}
          placeholder="Selecciona un tipo"
        />

        {expenseType === "variable" ? (
          <FormField
            autoCapitalize="none"
            control={control}
            inputMode="numeric"
            keyboardType="number-pad"
            label="Frecuencia en meses"
            name="frequencyMonths"
            placeholder="Ej: 3"
          />
        ) : null}

        <FormField
          control={control}
          label="Descripcion"
          multiline
          name="description"
          numberOfLines={4}
          placeholder="Opcional. Ej: arriendo, suscripcion, mercado..."
        />

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
  actionsRow: {
    marginTop: 10,
  },
  flexButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
});