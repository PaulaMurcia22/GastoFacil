import { useState } from "react";
import { Alert, View } from "react-native";

import { type HomeData } from "../auth/screens/home/home.types";
import { AppHeader } from "./components/AppHeader";
import { BottomNav } from "./components/BottomNav";
import { appStyles } from "./app.styles";
import { BottomNavScreen, UserAppScreen } from "./app.types";
import { HomeDashboardScreen } from "./screens/HomeDashboardScreen";
import { CreateIncomeScreen } from "../incomes/screens/CreateIncomeScreen";
import { IncomeDetailScreen } from "../incomes/screens/IncomeDetailScreen";
import { IncomeListScreen } from "../incomes/screens/IncomeListScreen";
import { CreateExpenseScreen } from "../expenses/screens/CreateExpenseScreen";
import { ExpenseDetailScreen } from "../expenses/screens/ExpenseDetailScreen";
import { ExpenseListScreen } from "../expenses/screens/ExpenseListScreen";
import { type IncomeItem } from "../incomes/income.types";
import { type ExpenseItem } from "../expenses/expense.types";

interface UserAppProps {
  session: HomeData;
  onCloseSession: () => void;
}

function resolveActiveNav(screen: UserAppScreen): BottomNavScreen {
  if (screen === "home") {
    return "home";
  }

  if (screen === "expense-list" || screen === "expense-create" || screen === "expense-detail") {
    return "expense-list";
  }

  return "income-list";
}

export function UserApp({ session, onCloseSession }: UserAppProps) {
  const [activeScreen, setActiveScreen] = useState<UserAppScreen>("home");
  const [selectedIncomeId, setSelectedIncomeId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const [incomeToEdit, setIncomeToEdit] = useState<IncomeItem | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleDataChanged = () => {
    setRefreshKey((current) => current + 1);
  };

  const handleBottomNavigate = (screen: BottomNavScreen) => {
    if (screen === "home") {
      setActiveScreen("home");
      return;
    }

    if (screen === "income-list") {
      setActiveScreen("income-list");
      return;
    }

    if (screen === "expense-list") {
      setActiveScreen("expense-list");
      return;
    }

    Alert.alert(
      "Seccion en preparacion",
      "El menu inferior ya esta visible, pero por ahora dejamos activos los flujos completos de ingresos y gastos.",
    );
  };

  return (
    <View style={appStyles.shell}>
      <AppHeader userName={session.user.nickname} />

      <View style={appStyles.content}>
        {activeScreen === "home" ? (
          <HomeDashboardScreen
            onCloseSession={onCloseSession}
            onGoToIncomeList={() => {
              setIncomeToEdit(null);
              setActiveScreen("income-list");
            }}
            onGoToExpenseList={() => {
              setExpenseToEdit(null);
              setActiveScreen("expense-list");
            }}
            refreshKey={refreshKey}
          />
        ) : null}

        {activeScreen === "income-list" ? (
          <IncomeListScreen
            onCreateIncome={() => {
              setIncomeToEdit(null);
              setActiveScreen("income-create");
            }}
            onDataChanged={handleDataChanged}
            onOpenIncome={(incomeId) => {
              setSelectedIncomeId(incomeId);
              setActiveScreen("income-detail");
            }}
            onEditIncome={(income) => {
              setIncomeToEdit(income);
              setActiveScreen("income-create");
            }}
            refreshKey={refreshKey}
          />
        ) : null}

        {activeScreen === "income-create" ? (
          <CreateIncomeScreen
            onCancel={() => {
              setIncomeToEdit(null);
              setActiveScreen("income-list");
            }}
            onIncomeSaved={() => {
              handleDataChanged();
              setIncomeToEdit(null);
              setActiveScreen("income-list");
            }}
            initialIncome={incomeToEdit}
          />
        ) : null}

        {activeScreen === "income-detail" && selectedIncomeId ? (
          <IncomeDetailScreen
            incomeId={selectedIncomeId}
            onBackToList={() => {
              setActiveScreen("income-list");
            }}
            onCreateAnother={() => {
              setActiveScreen("income-create");
            }}
          />
        ) : null}

        {activeScreen === "expense-list" ? (
          <ExpenseListScreen
            refreshKey={refreshKey}
            onCreateExpense={() => {
              setExpenseToEdit(null);
              setActiveScreen("expense-create");
            }}
            onDataChanged={handleDataChanged}
            onOpenExpense={(expenseId) => {
              setSelectedExpenseId(expenseId);
              setActiveScreen("expense-detail");
            }}
            onEditExpense={(expense) => {
              setExpenseToEdit(expense);
              setActiveScreen("expense-create");
            }}
          />
        ) : null}

        {activeScreen === "expense-create" ? (
          <CreateExpenseScreen
            onCancel={() => {
              setExpenseToEdit(null);
              setActiveScreen("expense-list");
            }}
            onExpenseSaved={() => {
              handleDataChanged();
              setExpenseToEdit(null);
              setActiveScreen("expense-list");
            }}
            initialExpense={expenseToEdit}
          />
        ) : null}

        {activeScreen === "expense-detail" && selectedExpenseId ? (
          <ExpenseDetailScreen
            expenseId={selectedExpenseId}
            onBackToList={() => {
              setActiveScreen("expense-list");
            }}
            onCreateAnother={() => {
              setActiveScreen("expense-create");
            }}
          />
        ) : null}
      </View>

      <BottomNav
        active={resolveActiveNav(activeScreen)}
        onNavigate={handleBottomNavigate}
      />
    </View>
  );
}
