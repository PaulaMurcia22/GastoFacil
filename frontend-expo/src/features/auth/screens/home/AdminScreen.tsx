import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  type PressableStateCallbackType,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors } from "../../../../theme/colors";
import { appStyles } from "../../../app/app.styles";
import { RegisterScreen } from "../register/RegisterScreen";
import {
  deactivateAdminUser,
  fetchAdminDashboard,
  logoutUser,
  promoteAdminUser,
} from "./home.api";
import {
  type AdminDashboardStats,
  type AdminDashboardUser,
} from "./admin.types";
import { type HomeData } from "./home.types";

interface AdminScreenProps {
  session: HomeData;
  onCloseSession: () => void;
}

type AdminTab = "home" | "users" | "create-user" | "profile";
type AdminNavIconVariant = "home" | "users" | "profile";
type MetricIconVariant =
  | "target"
  | "growth"
  | "activity"
  | "adoption"
  | "history"
  | "deposit"
  | "flow";

const emptyStats: AdminDashboardStats = {
  goalCompletionPercentage: 0,
  activeUserPercentage: 0,
  goalAdoptionPercentage: 0,
  savingsParticipationPercentage: 0,
  historicalUsersTotal: 0,
  monthlyGoalContributionUserPercentage: 0,
  monthlyIncomeExpenseUserPercentage: 0,
};

export function AdminScreen({ session, onCloseSession }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("home");
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [stats, setStats] = useState<AdminDashboardStats>(emptyStats);
  const [users, setUsers] = useState<AdminDashboardUser[]>([]);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isMounted = true) => {
    try {
      setIsLoading(true);
      const response = await fetchAdminDashboard();

      if (isMounted) {
        setStats(response.stats);
        setUsers(response.users);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible cargar el panel de administrador.";

      if (isMounted) {
        Alert.alert("Panel no disponible", message);
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadDashboard(isMounted);

    return () => {
      isMounted = false;
    };
  }, [loadDashboard]);

  const filteredUsers = useMemo(() => {
    const availableUsers = users.filter((user) => user.id !== session.user.id);
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return availableUsers;
    }

    return availableUsers.filter((user) => {
      const searchableText = `${user.fullName} ${user.nickname} ${user.email}`
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [searchValue, session.user.id, users]);

  const handleCloseSession = async () => {
    try {
      setIsClosing(true);
      await logoutUser();
    } finally {
      setIsClosing(false);
      onCloseSession();
    }
  };

  const handleDeactivateUser = async (user: AdminDashboardUser) => {
    try {
      setUpdatingUserId(user.id);
      const response = await deactivateAdminUser(user.id);
      setUsers(response.users);
      await loadDashboard();
      Alert.alert("Usuario inactivado", response.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible desactivar el usuario.";

      Alert.alert("Accion no completada", message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handlePromoteUser = async (user: AdminDashboardUser) => {
    try {
      setUpdatingUserId(user.id);
      const response = await promoteAdminUser(user.id);
      setUsers(response.users);
      await loadDashboard();
      Alert.alert("Rol actualizado", response.message);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible convertir el usuario en administrador.";

      Alert.alert("Accion no completada", message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <View style={styles.shell}>
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "create-user" ? (
          <RegisterScreen
            isAdminMode
            onCancel={() => setActiveTab("users")}
            onRegisterSuccess={(_email, message) => {
              Alert.alert("Usuario creado", message);
              void loadDashboard();
              setActiveTab("users");
            }}
          />
        ) : activeTab === "profile" ? (
          <ProfileSection
            isClosing={isClosing}
            onCloseSession={() => {
              void handleCloseSession();
            }}
            session={session}
          />
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>Panel de Administrador</Text>
              <Text style={styles.heroSubtitle}>
                Estadisticas y gestion de usuarios
              </Text>
            </View>

            {activeTab === "home" ? (
              <StatsSection isLoading={isLoading} stats={stats} />
            ) : null}

            {activeTab === "users" ? (
              <UsersSection
                filteredUsers={filteredUsers}
                isLoading={isLoading}
                onCreateUser={() => setActiveTab("create-user")}
                currentUserId={session.user.id}
                onDeactivateUser={(user) => {
                  void handleDeactivateUser(user);
                }}
                onPromoteUser={(user) => {
                  void handlePromoteUser(user);
                }}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
                updatingUserId={updatingUserId}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      <AdminBottomNav activeTab={activeTab} onNavigate={setActiveTab} />
    </View>
  );
}

function StatsSection({
  isLoading,
  stats,
}: {
  isLoading: boolean;
  stats: AdminDashboardStats;
}) {
  const statCards: Array<{
    id: string;
    icon: MetricIconVariant;
    label: string;
    value: string;
    tone: string;
  }> = [
    {
      id: "completion",
      icon: "target",
      label: "Cumplimiento metas",
      value: `${stats.goalCompletionPercentage.toFixed(0)}%`,
      tone: colors.accent,
    },
    {
      id: "savings",
      icon: "growth",
      label: "Usuarios con ahorro",
      value: `${stats.savingsParticipationPercentage.toFixed(0)}%`,
      tone: colors.success,
    },
    {
      id: "users",
      icon: "activity",
      label: "Usuarios activos",
      value: `${stats.activeUserPercentage.toFixed(0)}%`,
      tone: colors.primary,
    },
    {
      id: "active",
      icon: "adoption",
      label: "Adopcion de metas",
      value: `${stats.goalAdoptionPercentage.toFixed(0)}%`,
      tone: colors.success,
    },
    {
      id: "historical",
      icon: "history",
      label: "Usuarios historicos",
      value: String(stats.historicalUsersTotal),
      tone: colors.primary,
    },
    {
      id: "monthly-goals",
      icon: "deposit",
      label: "Abonaron este mes",
      value: `${stats.monthlyGoalContributionUserPercentage.toFixed(0)}%`,
      tone: colors.accent,
    },
    {
      id: "monthly-flow",
      icon: "flow",
      label: "Ingresos y gastos mes",
      value: `${stats.monthlyIncomeExpenseUserPercentage.toFixed(0)}%`,
      tone: colors.success,
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Estadisticas Globales</Text>

      <View style={styles.statsGrid}>
        {statCards.map((card) => (
          <View key={card.id} style={styles.statCard}>
            <View style={styles.statHeader}>
              <MetricIcon color={card.tone} variant={card.icon} />
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
            {isLoading ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.statLoader}
              />
            ) : (
              <Text style={styles.statValue}>{card.value}</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

function MetricIcon({
  color,
  variant,
}: {
  color: string;
  variant: MetricIconVariant;
}) {
  if (variant === "target") {
    return (
      <View style={[styles.metricIconFrame, { borderColor: color }]}>
        <View style={[styles.metricTargetRing, { borderColor: color }]}>
          <View style={[styles.metricTargetDot, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  if (variant === "growth") {
    return (
      <View style={styles.metricIconFrame}>
        <View style={styles.metricBars}>
          <View style={[styles.metricBarSmall, { backgroundColor: color }]} />
          <View style={[styles.metricBarMedium, { backgroundColor: color }]} />
          <View style={[styles.metricBarTall, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  if (variant === "activity") {
    return (
      <View style={styles.metricIconFrame}>
        <View style={[styles.metricPersonHead, { borderColor: color }]} />
        <View style={[styles.metricPersonBody, { borderColor: color }]} />
      </View>
    );
  }

  if (variant === "adoption") {
    return (
      <View style={styles.metricIconFrame}>
        <View style={[styles.metricDiamond, { borderColor: color }]}>
          <View style={[styles.metricDiamondDot, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  if (variant === "history") {
    return (
      <View style={styles.metricIconFrame}>
        <View style={[styles.metricClock, { borderColor: color }]}>
          <View style={[styles.metricClockHandTall, { backgroundColor: color }]} />
          <View style={[styles.metricClockHandWide, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  if (variant === "deposit") {
    return (
      <View style={styles.metricIconFrame}>
        <View style={[styles.metricCoin, { borderColor: color }]}>
          <View style={[styles.metricCoinLine, { backgroundColor: color }]} />
        </View>
        <View style={[styles.metricDepositBase, { backgroundColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.metricIconFrame}>
      <View style={[styles.metricFlowTop, { borderColor: color }]} />
      <View style={[styles.metricFlowBottom, { borderColor: color }]} />
      <View style={[styles.metricFlowCenter, { backgroundColor: color }]} />
    </View>
  );
}

function UsersSection({
  filteredUsers,
  currentUserId,
  isLoading,
  onCreateUser,
  onDeactivateUser,
  onPromoteUser,
  searchValue,
  setSearchValue,
  updatingUserId,
}: {
  filteredUsers: AdminDashboardUser[];
  currentUserId: string;
  isLoading: boolean;
  onCreateUser: () => void;
  onDeactivateUser: (user: AdminDashboardUser) => void;
  onPromoteUser: (user: AdminDashboardUser) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
  updatingUserId: string | null;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Gestion de Usuarios</Text>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            autoCapitalize="none"
            onChangeText={setSearchValue}
            placeholder="Buscar usuario..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={searchValue}
          />
        </View>

        <Pressable
          onPress={onCreateUser}
          style={({ pressed }: PressableStateCallbackType) => [
            styles.createUserButton,
            pressed ? styles.createUserButtonPressed : null,
          ]}
        >
          <Text style={styles.createUserButtonText}>+</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.primary} />
          <Text style={appStyles.helperText}>Cargando usuarios...</Text>
        </View>
      ) : null}

      {!isLoading && filteredUsers.length === 0 ? (
        <View style={appStyles.emptyStateCard}>
          <Text style={appStyles.emptyStateTitle}>Sin usuarios</Text>
          <Text style={appStyles.emptyStateText}>
            No encontramos usuarios con ese criterio de busqueda.
          </Text>
        </View>
      ) : null}

      {!isLoading &&
        filteredUsers.map((user) => (
          <View key={user.id} style={styles.userCard}>
            <View style={styles.userHeader}>
              <View style={styles.userCopy}>
                <Text style={styles.userName}>{user.fullName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>
              </View>
            </View>

            <View style={styles.userStatsRow}>
              <View style={styles.userMetricBlock}>
                <Text style={styles.userMetricLabel}>Metas:</Text>
                <Text style={styles.userMetricValue}>
                  {user.goalsCompleted}/{user.goalsTotal}
                </Text>
              </View>
              <View style={styles.userMetricBlock}>
                <Text style={styles.userMetricLabel}>Metas con ahorro:</Text>
                <Text style={styles.userMetricValue}>
                  {user.savingsParticipationPercentage.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText} numberOfLines={1}>
                  {user.roleLabel}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {user.status === 1 ? "Activo" : "Inactivo"}
                </Text>
              </View>
            </View>

            <View style={styles.userActionRow}>
              <Pressable
                disabled={
                  user.status !== 1 ||
                  user.roleId === 2 ||
                  updatingUserId === user.id
                }
                onPress={() => onPromoteUser(user)}
                style={({ pressed }: PressableStateCallbackType) => [
                  appStyles.buttonSecondary,
                  styles.userActionButton,
                  pressed ? appStyles.buttonSecondaryPressed : null,
                  user.status !== 1 ||
                  user.roleId === 2 ||
                  updatingUserId === user.id
                    ? styles.actionDisabled
                    : null,
                ]}
              >
                {updatingUserId === user.id ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <Text style={appStyles.buttonSecondaryText}>Hacer admin</Text>
                )}
              </Pressable>

              <Pressable
                disabled={
                  user.status !== 1 ||
                  user.id === currentUserId ||
                  updatingUserId === user.id
                }
                onPress={() => onDeactivateUser(user)}
                style={({ pressed }: PressableStateCallbackType) => [
                  appStyles.buttonGhost,
                  styles.userActionButton,
                  pressed ? appStyles.buttonGhostPressed : null,
                  user.status !== 1 ||
                  user.id === currentUserId ||
                  updatingUserId === user.id
                    ? styles.actionDisabled
                    : null,
                ]}
              >
                {updatingUserId === user.id ? (
                  <ActivityIndicator color={colors.textMuted} />
                ) : (
                  <Text style={appStyles.buttonGhostText}>Inactivar</Text>
                )}
              </Pressable>
            </View>
          </View>
        ))}
    </View>
  );
}

function ProfileSection({
  isClosing,
  onCloseSession,
  session,
}: {
  isClosing: boolean;
  onCloseSession: () => void;
  session: HomeData;
}) {
  return (
    <View style={styles.profileSection}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Perfil Admin</Text>
        <Text style={styles.heroSubtitle}>{session.user.email}</Text>
      </View>

      <View style={styles.profileCard}>
        <Text style={styles.userName}>{session.user.fullName}</Text>
        <Text style={styles.userEmail}>Usuario: {session.user.nickname}</Text>

        <Pressable
          disabled={isClosing}
          onPress={onCloseSession}
          style={({ pressed }: PressableStateCallbackType) => [
            appStyles.buttonPrimary,
            styles.logoutButton,
            pressed ? appStyles.buttonPrimaryPressed : null,
            isClosing ? styles.logoutButtonDisabled : null,
          ]}
        >
          {isClosing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={appStyles.buttonPrimaryText}>Cerrar sesion</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function AdminBottomNav({
  activeTab,
  onNavigate,
}: {
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
}) {
  const items: Array<{ id: AdminTab; label: string; icon: AdminNavIconVariant }> = [
    { id: "home", label: "Inicio", icon: "home" },
    { id: "users", label: "Usuarios", icon: "users" },
    { id: "profile", label: "Perfil", icon: "profile" },
  ];

  return (
    <View style={styles.navBar}>
      {items.map((item) => {
        const isActive = item.id === activeTab;

        return (
          <Pressable
            key={item.id}
            onPress={() => onNavigate(item.id)}
            style={styles.navItem}
          >
            <AdminNavIcon isActive={isActive} variant={item.icon} />
            <Text style={[styles.navText, isActive ? styles.navTextActive : null]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AdminNavIcon({
  isActive,
  variant,
}: {
  isActive: boolean;
  variant: AdminNavIconVariant;
}) {
  const color = isActive ? "#FFFFFF" : "rgba(255,255,255,0.72)";

  if (variant === "home") {
    return (
      <View style={styles.adminNavIconFrame}>
        <View style={[styles.adminNavHomeRoof, { borderColor: color }]} />
        <View style={[styles.adminNavHomeBody, { borderColor: color }]}>
          <View style={[styles.adminNavHomeDoor, { backgroundColor: color }]} />
        </View>
      </View>
    );
  }

  if (variant === "users") {
    return (
      <View style={styles.adminNavIconFrame}>
        <View style={[styles.adminNavUsersHeadMain, { borderColor: color }]} />
        <View style={[styles.adminNavUsersBodyMain, { borderColor: color }]} />
        <View style={[styles.adminNavUsersHeadSide, { borderColor: color }]} />
        <View style={[styles.adminNavUsersBodySide, { borderColor: color }]} />
      </View>
    );
  }

  return (
    <View style={styles.adminNavIconFrame}>
      <View style={[styles.adminNavProfileHead, { borderColor: color }]} />
      <View style={[styles.adminNavProfileBody, { borderColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContent: {
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: "#0E4A5A",
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "800",
  },
  heroSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 15,
    marginTop: 6,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  statCard: {
    flexBasis: "47%",
    flexGrow: 1,
    minWidth: 130,
    minHeight: 112,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statIcon: {
    fontSize: 19,
    fontWeight: "800",
  },
  metricIconFrame: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricTargetRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  metricTargetDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  metricBars: {
    width: 22,
    height: 20,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  metricBarSmall: {
    width: 5,
    height: 8,
    borderRadius: 3,
  },
  metricBarMedium: {
    width: 5,
    height: 13,
    borderRadius: 3,
  },
  metricBarTall: {
    width: 5,
    height: 18,
    borderRadius: 3,
  },
  metricPersonHead: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  metricPersonBody: {
    width: 20,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 2,
    borderBottomWidth: 0,
    marginTop: 3,
  },
  metricDiamond: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
    transform: [{ rotate: "45deg" }],
    alignItems: "center",
    justifyContent: "center",
  },
  metricDiamondDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricClock: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  metricClockHandTall: {
    width: 2,
    height: 8,
    borderRadius: 2,
    position: "absolute",
    top: 5,
  },
  metricClockHandWide: {
    width: 7,
    height: 2,
    borderRadius: 2,
    position: "absolute",
    left: 10,
    top: 11,
  },
  metricCoin: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
  },
  metricCoinLine: {
    width: 7,
    height: 2,
    borderRadius: 2,
  },
  metricDepositBase: {
    width: 22,
    height: 3,
    borderRadius: 2,
    marginTop: 2,
  },
  metricFlowTop: {
    width: 20,
    height: 8,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 8,
  },
  metricFlowBottom: {
    width: 20,
    height: 8,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 8,
    marginTop: 1,
  },
  metricFlowCenter: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
  },
  statLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 20,
  },
  statLoader: {
    alignSelf: "flex-start",
    marginTop: 14,
  },
  statValue: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "800",
    marginTop: 10,
  },
  searchBox: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.input,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  createUserButton: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  createUserButtonPressed: {
    backgroundColor: colors.primarySoft,
  },
  createUserButtonText: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    marginTop: -2,
  },
  searchIcon: {
    color: colors.textMuted,
    fontSize: 28,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 10,
  },
  loadingBox: {
    alignItems: "flex-start",
    marginTop: 8,
  },
  userCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 12,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  userCopy: {
    flex: 1,
  },
  userName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  userEmail: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  userActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconButtonPressed: {
    backgroundColor: colors.input,
  },
  iconButtonDisabled: {
    opacity: 0.35,
  },
  deleteIcon: {
    color: "#E0002A",
    fontSize: 24,
    fontWeight: "800",
  },
  disabledIcon: {
    color: colors.textMuted,
  },
  userStatsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  userMetricBlock: {
    minWidth: 96,
  },
  userMetricLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  userMetricValue: {
    color: colors.textMuted,
    fontSize: 15,
    marginTop: 3,
  },
  statusPill: {
    borderRadius: 999,
    backgroundColor: colors.input,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
  },
  rolePill: {
    maxWidth: "100%",
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rolePillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    flexShrink: 1,
  },
  userActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  userActionButton: {
    flex: 1,
    minHeight: 42,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  profileSection: {
    flex: 1,
  },
  profileCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
  },
  logoutButton: {
    marginTop: 20,
  },
  logoutButtonDisabled: {
    opacity: 0.65,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "#0E4A5A",
    paddingTop: 10,
    paddingBottom: 14,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  adminNavIconFrame: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  adminNavHomeRoof: {
    width: 16,
    height: 16,
    borderLeftWidth: 2,
    borderTopWidth: 2,
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
    marginBottom: -7,
  },
  adminNavHomeBody: {
    width: 18,
    height: 15,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  adminNavHomeDoor: {
    width: 5,
    height: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  adminNavUsersHeadMain: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    position: "absolute",
    top: 3,
    left: 7,
  },
  adminNavUsersBodyMain: {
    width: 17,
    height: 10,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderWidth: 2,
    borderBottomWidth: 0,
    position: "absolute",
    bottom: 4,
    left: 3,
  },
  adminNavUsersHeadSide: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
    position: "absolute",
    top: 6,
    right: 3,
  },
  adminNavUsersBodySide: {
    width: 12,
    height: 8,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderWidth: 2,
    borderBottomWidth: 0,
    position: "absolute",
    bottom: 4,
    right: 0,
  },
  adminNavProfileHead: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  adminNavProfileBody: {
    width: 21,
    height: 11,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    borderWidth: 2,
    borderBottomWidth: 0,
    marginTop: 3,
  },
  navText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4,
  },
  navTextActive: {
    color: "#FFFFFF",
  },
});
