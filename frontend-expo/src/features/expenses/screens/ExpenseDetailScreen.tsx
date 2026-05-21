import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { appStyles } from "../../app/app.styles";
import { formatCurrency, formatDate } from "../../app/formatters";
import { deleteExpense, fetchExpenseDetail } from "../expense.api";
import { ExpenseItem } from "../expense.types";
import { colors } from "../../../theme/colors";

interface ExpenseDetailScreenProps {
  expenseId: string;
  onBackToList: () => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onExpenseDeleted: () => void;
}

export function ExpenseDetailScreen({
  expenseId,
  onBackToList,
  onEditExpense,
  onExpenseDeleted,
}: ExpenseDetailScreenProps) {
  const [expense, setExpense] = useState<ExpenseItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      try {
        setIsLoading(true);
        const response = await fetchExpenseDetail(expenseId);

        if (isMounted) {
          setExpense(response.item);
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
  }, [expenseId]);

  const handleDelete = (expense: ExpenseItem) => {
    Alert.alert(
      "Eliminar gasto",
      "Deseas eliminar este gasto? Esta accion no se puede deshacer.",
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
                await deleteExpense(expense.id);
                onExpenseDeleted();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "No fue posible eliminar el gasto.";

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
        <ActivityIndicator size="large" color="#314A63" />
        <Text style={[appStyles.pageSubtitle, styles.centerText]}>
          Cargando detalle del gasto...
        </Text>
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={appStyles.centeredState}>
        <Text style={appStyles.emptyStateTitle}>Gasto no encontrado</Text>
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

        <Text style={styles.topMenuTitle}>Detalle del gasto</Text>

        <View style={styles.topActions}>
          <Pressable
            onPress={() => {
              onEditExpense(expense);
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
              handleDelete(expense);
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
        Revisa la informacion completa del registro seleccionado.
      </Text>

      <View style={appStyles.summaryPrimaryCard}>
        <Text style={appStyles.summaryPrimaryLabel}>Monto registrado</Text>
        <Text style={appStyles.summaryPrimaryValue}>
          {formatCurrency(expense.amount)}
        </Text>
      </View>

      <View style={appStyles.sectionCard}>
        <Text style={appStyles.sectionTitle}>Informacion general</Text>

        <View style={appStyles.detailGrid}>
          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Categoria</Text>
            <Text style={appStyles.detailItemValue}>{expense.category.name}</Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Fecha del gasto</Text>
            <Text style={appStyles.detailItemValue}>
              {formatDate(expense.expenseDate)}
            </Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Tipo de gasto</Text>
            <Text style={appStyles.detailItemValue}>
              {expense.expenseTypeLabel}
            </Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Frecuencia</Text>
            <Text style={appStyles.detailItemValue}>
              {expense.frequencyLabel ?? "No aplica"}
            </Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Descripcion</Text>
            <Text style={appStyles.detailItemValue}>
              {expense.description || "Sin descripcion registrada"}
            </Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Estado</Text>
            <Text style={appStyles.detailItemValue}>
              {expense.status === 1 ? "Activo" : "Inactivo"}
            </Text>
          </View>
        </View>
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
  },
});
