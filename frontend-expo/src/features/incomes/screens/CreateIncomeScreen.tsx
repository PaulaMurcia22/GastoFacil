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
import { SelectField } from "../../app/components/SelectField";
import { DateField } from "../../app/components/DateField";
import { createIncome, fetchIncomeCategories, updateIncome } from "../income.api";
import {
  incomeSchema,
  type IncomeFormValues,
  toIncomePayload,
} from "../income.schema";
import { IncomeCategory, type IncomeItem } from "../income.types";

interface CreateIncomeScreenProps {
  onCancel: () => void;
  onIncomeSaved: () => void;
  initialIncome?: IncomeItem | null;
}

const periodicityOptions = [
  { label: "Mensual", value: "monthly" },
  { label: "Quincenal", value: "biweekly" },
  { label: "Unico", value: "one_time" },
];

function buildTodayValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CreateIncomeScreen({
  onCancel,
  onIncomeSaved,
  initialIncome,
}: CreateIncomeScreenProps) {
  const [categories, setCategories] = useState<IncomeCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const isEditing = Boolean(initialIncome);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    shouldUnregister: true,
    defaultValues: {
      amount: "",
      incomeDate: buildTodayValue(),
      categoryId: "",
      periodicity: "",
      description: "",
    },
  });

  useEffect(() => {
    if (initialIncome) {
      reset({
        amount: String(initialIncome.amount),
        incomeDate: initialIncome.incomeDate,
        categoryId: initialIncome.category.id,
        periodicity: initialIncome.periodicity,
        description: initialIncome.description ?? "",
      });
      return;
    }

    reset({
      amount: "",
      incomeDate: buildTodayValue(),
      categoryId: "",
      periodicity: "",
      description: "",
    });
  }, [initialIncome, reset]);

  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetchIncomeCategories();

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
      const payload = toIncomePayload(values);

      if (initialIncome) {
        await updateIncome(initialIncome.id, payload);
        Alert.alert(
          "Ingreso actualizado",
          "Los cambios fueron guardados correctamente.",
        );
      } else {
        await createIncome(payload);
        Alert.alert(
          "Ingreso registrado",
          "El ingreso fue guardado y ya aparece en tu lista.",
        );
      }

      onIncomeSaved();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible registrar el ingreso.";

      Alert.alert("Registro no completado", message);
    }
  });

  return (
    <ScrollView
      contentContainerStyle={appStyles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <Text style={appStyles.pageTitle}>
        {isEditing ? "Editar ingreso" : "Registrar ingreso"}
      </Text>
      <Text style={appStyles.pageSubtitle}>
        {isEditing
          ? "Actualiza los datos del ingreso y guarda los cambios en tu historial."
          : "Completa los datos principales del dinero recibido y guárdalo en tu historial."}
      </Text>

      <View style={appStyles.sectionCard}>
        <FormField
          autoCapitalize="none"
          control={control}
          inputMode="decimal"
          keyboardType="decimal-pad"
          label="Monto"
          name="amount"
          placeholder="Ej: 2500000"
        />

        <DateField
          control={control}
          label="Fecha"
          name="incomeDate"
          placeholder="Selecciona una fecha"
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
          label="Periodicidad"
          name="periodicity"
          options={periodicityOptions}
          placeholder="Selecciona una periodicidad"
        />

        <FormField
          control={control}
          label="Descripcion"
          multiline
          name="description"
          numberOfLines={4}
          placeholder="Opcional. Ej: pago de freelance, bono, comision..."
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
