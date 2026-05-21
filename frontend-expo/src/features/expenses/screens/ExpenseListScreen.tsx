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

import { appStyles } from "../../app/app.styles";
import { formatCurrency, formatDate } from "../../app/formatters";
import { deleteExpense, fetchExpenses } from "../expense.api";
import { ExpenseItem } from "../expense.types";

interface ExpenseListScreenProps {
  refreshKey: number;
  onCreateExpense: () => void;
  onOpenExpense: (expenseId: string) => void;
  onEditExpense: (expense: ExpenseItem) => void;
  onDataChanged: () => void;
}

export function ExpenseListScreen({
  refreshKey,
  onCreateExpense,
  onOpenExpense,
  onEditExpense,
  onDataChanged,
}: ExpenseListScreenProps) {
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const loadExpenses = async () => {
      try {
        setIsLoading(true);
        const response = await fetchExpenses();

        if (isMounted) {
          setItems(response.items);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar los gastos.";

        if (isMounted) {
          Alert.alert("Lista no disponible", message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadExpenses();

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

  const handleDelete = (expense: ExpenseItem) => {
    Alert.alert(
      "Eliminar gasto",
      "¿Deseas eliminar este gasto? Esta accion no se puede deshacer.",
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
                setItems((current) =>
                  current.filter((currentExpense) => currentExpense.id !== expense.id),
                );
                onDataChanged();
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

  return (
    <ScrollView
      contentContainerStyle={appStyles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View style={styles.headerCopy}>
          <Text style={appStyles.pageTitle}>Lista de gastos</Text>
          <Text style={appStyles.pageSubtitle}>
            Consulta tus registros, filtra por categoria y toca cualquiera para ver el detalle.
          </Text>
        </View>

        <Pressable
          onPress={onCreateExpense}
          style={({ pressed }) => [
            appStyles.buttonPrimary,
            styles.createButton,
            pressed ? appStyles.buttonPrimaryPressed : null,
          ]}
        >
          <Text style={appStyles.buttonPrimaryText}>Nuevo</Text>
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
          <ActivityIndicator size="large" color="#314A63" />
          <Text style={[appStyles.pageSubtitle, styles.centerText]}>
            Cargando gastos...
          </Text>
        </View>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <View style={appStyles.emptyStateCard}>
          <Text style={appStyles.emptyStateTitle}>Aun no tienes gastos</Text>
          <Text style={appStyles.emptyStateText}>
            Registra tu primer gasto y desde aqui podras revisar su detalle.
          </Text>

          <Pressable
            onPress={onCreateExpense}
            style={({ pressed }) => [
              appStyles.buttonPrimary,
              styles.emptyButton,
              pressed ? appStyles.buttonPrimaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonPrimaryText}>Registrar gasto</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && items.length > 0 && filteredItems.length === 0 ? (
        <View style={appStyles.emptyStateCard}>
          <Text style={appStyles.emptyStateTitle}>Sin gastos en esta categoria</Text>
          <Text style={appStyles.emptyStateText}>
            Cambia de pestaña o vuelve a la opcion de todos para ver mas registros.
          </Text>
        </View>
      ) : null}

      {!isLoading &&
        filteredItems.map((expense) => (
          <Pressable
            key={expense.id}
            onPress={() => {
              onOpenExpense(expense.id);
            }}
            style={({ pressed }) => [
              appStyles.listCard,
              pressed ? appStyles.listCardPressed : null,
            ]}
          >
            <Text style={appStyles.amountText}>
              {formatCurrency(expense.amount)}
            </Text>
            <Text style={[appStyles.mutedText, styles.topSpacingSmall]}>
              {formatDate(expense.expenseDate)}
            </Text>

            <View style={appStyles.tagRow}>
              <View style={appStyles.tagPrimary}>
                <Text style={appStyles.tagPrimaryText}>{expense.category.name}</Text>
              </View>
              <View style={appStyles.tagNeutral}>
                <Text style={appStyles.tagNeutralText}>
                  {expense.expenseTypeLabel}
                </Text>
              </View>
              {expense.frequencyLabel ? (
                <View style={appStyles.tagNeutral}>
                  <Text style={appStyles.tagNeutralText}>
                    {expense.frequencyLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            {expense.description ? (
              <Text style={[appStyles.mutedText, styles.descriptionText]}>
                {expense.description}
              </Text>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onEditExpense(expense);
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
                  handleDelete(expense);
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
        ))}
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
  centerText: {
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 16,
    alignSelf: "stretch",
  },
  topSpacingSmall: {
    marginTop: 8,
  },
  descriptionText: {
    marginTop: 12,
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
    backgroundColor: "#314A63",
  },
  tabPressed: {
    opacity: 0.88,
  },
  tabText: {
    color: "#556270",
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#FFFFFF",
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
