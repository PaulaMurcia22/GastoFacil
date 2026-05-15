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
import { deleteIncome, fetchIncomes } from "../income.api";
import { IncomeItem } from "../income.types";

interface IncomeListScreenProps {
  refreshKey: number;
  onCreateIncome: () => void;
  onOpenIncome: (incomeId: string) => void;
  onEditIncome: (income: IncomeItem) => void;
  onDataChanged: () => void;
}

export function IncomeListScreen({
  refreshKey,
  onCreateIncome,
  onOpenIncome,
  onEditIncome,
  onDataChanged,
}: IncomeListScreenProps) {
  const [items, setItems] = useState<IncomeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategoryId, setActiveCategoryId] = useState("all");

  useEffect(() => {
    let isMounted = true;

    const loadIncomes = async () => {
      try {
        setIsLoading(true);
        const response = await fetchIncomes();

        if (isMounted) {
          setItems(response.items);
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No fue posible cargar los ingresos.";

        if (isMounted) {
          Alert.alert("Lista no disponible", message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadIncomes();

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

  const handleDelete = (income: IncomeItem) => {
    Alert.alert(
      "Eliminar ingreso",
      "¿Deseas eliminar este ingreso? Esta accion no se puede deshacer.",
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
                await deleteIncome(income.id);
                setItems((current) =>
                  current.filter((currentIncome) => currentIncome.id !== income.id),
                );
                onDataChanged();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "No fue posible eliminar el ingreso.";

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
          <Text style={appStyles.pageTitle}>Lista de ingresos</Text>
          <Text style={appStyles.pageSubtitle}>
            Consulta tus registros, filtra por categoria y toca cualquiera para ver el detalle.
          </Text>
        </View>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => {
              setActiveCategoryId("all");
            }}
            style={({ pressed }) => [
              appStyles.buttonSecondary,
              styles.filterButton,
              pressed ? appStyles.buttonSecondaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonSecondaryText}>Filtrar</Text>
          </Pressable>

          <Pressable
            onPress={onCreateIncome}
            style={({ pressed }) => [
              appStyles.buttonPrimary,
              styles.createButton,
              pressed ? appStyles.buttonPrimaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonPrimaryText}>Nuevo</Text>
          </Pressable>
        </View>
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
            Cargando ingresos...
          </Text>
        </View>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <View style={appStyles.emptyStateCard}>
          <Text style={appStyles.emptyStateTitle}>Aun no tienes ingresos</Text>
          <Text style={appStyles.emptyStateText}>
            Registra tu primer ingreso y desde aqui podras revisar su detalle.
          </Text>

          <Pressable
            onPress={onCreateIncome}
            style={({ pressed }) => [
              appStyles.buttonPrimary,
              styles.emptyButton,
              pressed ? appStyles.buttonPrimaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonPrimaryText}>Registrar ingreso</Text>
          </Pressable>
        </View>
      ) : null}

      {!isLoading && items.length > 0 && filteredItems.length === 0 ? (
        <View style={appStyles.emptyStateCard}>
          <Text style={appStyles.emptyStateTitle}>Sin ingresos en esta categoria</Text>
          <Text style={appStyles.emptyStateText}>
            Cambia de pestaña o vuelve a la opcion de todos para ver mas registros.
          </Text>
        </View>
      ) : null}

      {!isLoading &&
        filteredItems.map((income) => (
          <Pressable
            key={income.id}
            onPress={() => {
              onOpenIncome(income.id);
            }}
            style={({ pressed }) => [
              appStyles.listCard,
              pressed ? appStyles.listCardPressed : null,
            ]}
          >
            <Text style={appStyles.amountText}>
              {formatCurrency(income.amount)}
            </Text>
            <Text style={[appStyles.mutedText, styles.topSpacingSmall]}>
              {formatDate(income.incomeDate)}
            </Text>

            <View style={appStyles.tagRow}>
              <View style={appStyles.tagPrimary}>
                <Text style={appStyles.tagPrimaryText}>{income.category.name}</Text>
              </View>
              <View style={appStyles.tagNeutral}>
                <Text style={appStyles.tagNeutralText}>
                  {income.periodicityLabel}
                </Text>
              </View>
            </View>

            {income.description ? (
              <Text style={[appStyles.mutedText, styles.descriptionText]}>
                {income.description}
              </Text>
            ) : null}

            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => {
                  onEditIncome(income);
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
                onPress={() => {
                  handleDelete(income);
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
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  createButton: {
    minWidth: 92,
  },
  filterButton: {
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
