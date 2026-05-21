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
import { deleteIncome, fetchIncomeDetail } from "../income.api";
import { IncomeItem } from "../income.types";
import { colors } from "../../../theme/colors";

interface IncomeDetailScreenProps {
  incomeId: string;
  onBackToList: () => void;
  onEditIncome: (income: IncomeItem) => void;
  onIncomeDeleted: () => void;
}

export function IncomeDetailScreen({
  incomeId,
  onBackToList,
  onEditIncome,
  onIncomeDeleted,
}: IncomeDetailScreenProps) {
  const [income, setIncome] = useState<IncomeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDetail = async () => {
      try {
        setIsLoading(true);
        const response = await fetchIncomeDetail(incomeId);

        if (isMounted) {
          setIncome(response.item);
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
  }, [incomeId]);

  const handleDelete = (income: IncomeItem) => {
    Alert.alert(
      "Eliminar ingreso",
      "Deseas eliminar este ingreso? Esta accion no se puede deshacer.",
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
                onIncomeDeleted();
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

  if (isLoading) {
    return (
      <View style={appStyles.centeredState}>
        <ActivityIndicator size="large" color="#314A63" />
        <Text style={[appStyles.pageSubtitle, styles.centerText]}>
          Cargando detalle del ingreso...
        </Text>
      </View>
    );
  }

  if (!income) {
    return (
      <View style={appStyles.centeredState}>
        <Text style={appStyles.emptyStateTitle}>Ingreso no encontrado</Text>
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

        <Text style={styles.topMenuTitle}>Detalle del ingreso</Text>

        <View style={styles.topActions}>
          <Pressable
            onPress={() => {
              onEditIncome(income);
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
              handleDelete(income);
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
          {formatCurrency(income.amount)}
        </Text>
      </View>

      <View style={appStyles.sectionCard}>
        <Text style={appStyles.sectionTitle}>Informacion general</Text>

        <View style={appStyles.detailGrid}>
          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Categoria</Text>
            <Text style={appStyles.detailItemValue}>{income.category.name}</Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Fecha del ingreso</Text>
            <Text style={appStyles.detailItemValue}>
              {formatDate(income.incomeDate)}
            </Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Periodicidad</Text>
            <Text style={appStyles.detailItemValue}>
              {income.periodicityLabel}
            </Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Descripcion</Text>
            <Text style={appStyles.detailItemValue}>
              {income.description || "Sin descripcion registrada"}
            </Text>
          </View>

          <View style={appStyles.detailItem}>
            <Text style={appStyles.detailItemLabel}>Estado</Text>
            <Text style={appStyles.detailItemValue}>
              {income.status === 1 ? "Activo" : "Inactivo"}
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
    alignSelf: "stretch",
  },
});
