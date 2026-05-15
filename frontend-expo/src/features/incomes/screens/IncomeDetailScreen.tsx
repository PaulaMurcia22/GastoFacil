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

import { appStyles } from "../../app/app.styles";
import { formatCurrency, formatDate } from "../../app/formatters";
import { fetchIncomeDetail } from "../income.api";
import { IncomeItem } from "../income.types";

interface IncomeDetailScreenProps {
  incomeId: string;
  onBackToList: () => void;
  onCreateAnother: () => void;
}

export function IncomeDetailScreen({
  incomeId,
  onBackToList,
  onCreateAnother,
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
      <Text style={appStyles.pageTitle}>Detalle del ingreso</Text>
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

        <View style={[appStyles.row, styles.actionsRow]}>
          <Pressable
            onPress={onBackToList}
            style={({ pressed }) => [
              appStyles.buttonSecondary,
              styles.flexButton,
              pressed ? appStyles.buttonSecondaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonSecondaryText}>Volver</Text>
          </Pressable>

          <Pressable
            onPress={onCreateAnother}
            style={({ pressed }) => [
              appStyles.buttonPrimary,
              styles.flexButton,
              pressed ? appStyles.buttonPrimaryPressed : null,
            ]}
          >
            <Text style={appStyles.buttonPrimaryText}>Registrar otro</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centerText: {
    textAlign: "center",
  },
  missingAction: {
    marginTop: 16,
    alignSelf: "stretch",
  },
  actionsRow: {
    marginTop: 18,
  },
  flexButton: {
    flex: 1,
  },
});
