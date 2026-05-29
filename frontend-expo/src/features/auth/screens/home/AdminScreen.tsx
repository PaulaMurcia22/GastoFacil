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

const emptyStats: AdminDashboardStats = {
  goalCompletionPercentage: 0,
  activeUserPercentage: 0,
  goalAdoptionPercentage: 0,
  savingsParticipationPercentage: 0,
};

export function AdminScreen({ session, onCloseSession }: AdminScreenProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("home");
  const [isClosing, setIsClosing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [stats, setStats] = useState<AdminDashboardStats>(emptyStats);
  const [users, setUsers] = useState<AdminDashboardUser[]>([]);

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
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return users;
    }

    return users.filter((user) => {
      const searchableText = `${user.fullName} ${user.nickname} ${user.email}`
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [searchValue, users]);

  const handleCloseSession = async () => {
    try {
      setIsClosing(true);
      await logoutUser();
    } finally {
      setIsClosing(false);
      onCloseSession();
    }
  };

  const handleDeactivateUser = (user: AdminDashboardUser) => {
    Alert.alert(
      "Desactivar usuario",
      `Deseas desactivar la cuenta de ${user.fullName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desactivar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                const response = await deactivateAdminUser(user.id);
                setUsers(response.users);
                await loadDashboard();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "No fue posible desactivar el usuario.";

                Alert.alert("Accion no completada", message);
              }
            })();
          },
        },
      ],
    );
  };

  const handlePromoteUser = (user: AdminDashboardUser) => {
    Alert.alert(
      "Convertir en administrador",
      `Deseas convertir a ${user.fullName} en administrador?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Convertir",
          onPress: () => {
            void (async () => {
              try {
                const response = await promoteAdminUser(user.id);
                setUsers(response.users);
                await loadDashboard();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : "No fue posible convertir el usuario en administrador.";

                Alert.alert("Accion no completada", message);
              }
            })();
          },
        },
      ],
    );
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
                onDeactivateUser={handleDeactivateUser}
                onPromoteUser={handlePromoteUser}
                searchValue={searchValue}
                setSearchValue={setSearchValue}
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
  const statCards = [
    {
      id: "completion",
      icon: "◎",
      label: "Cumplimiento metas",
      value: `${stats.goalCompletionPercentage.toFixed(0)}%`,
      tone: colors.accent,
    },
    {
      id: "savings",
      icon: "◌",
      label: "Usuarios con ahorro",
      value: `${stats.savingsParticipationPercentage.toFixed(0)}%`,
      tone: colors.success,
    },
    {
      id: "users",
      icon: "▦",
      label: "Usuarios activos",
      value: `${stats.activeUserPercentage.toFixed(0)}%`,
      tone: colors.primary,
    },
    {
      id: "active",
      icon: "◇",
      label: "Adopcion de metas",
      value: `${stats.goalAdoptionPercentage.toFixed(0)}%`,
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
              <Text style={[styles.statIcon, { color: card.tone }]}>
                {card.icon}
              </Text>
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

function UsersSection({
  filteredUsers,
  currentUserId,
  isLoading,
  onCreateUser,
  onDeactivateUser,
  onPromoteUser,
  searchValue,
  setSearchValue,
}: {
  filteredUsers: AdminDashboardUser[];
  currentUserId: string;
  isLoading: boolean;
  onCreateUser: () => void;
  onDeactivateUser: (user: AdminDashboardUser) => void;
  onPromoteUser: (user: AdminDashboardUser) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
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
              <View>
                <Text style={styles.userMetricLabel}>Metas:</Text>
                <Text style={styles.userMetricValue}>
                  {user.goalsCompleted}/{user.goalsTotal}
                </Text>
              </View>
              <View>
                <Text style={styles.userMetricLabel}>Metas con ahorro:</Text>
                <Text style={styles.userMetricValue}>
                  {user.savingsParticipationPercentage.toFixed(0)}%
                </Text>
              </View>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{user.roleLabel}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusPillText}>
                  {user.status === 1 ? "Activo" : "Inactivo"}
                </Text>
              </View>
            </View>

            <View style={styles.userActionRow}>
              <Pressable
                disabled={user.status !== 1 || user.roleId === 2}
                onPress={() => onPromoteUser(user)}
                style={({ pressed }: PressableStateCallbackType) => [
                  appStyles.buttonSecondary,
                  styles.userActionButton,
                  pressed ? appStyles.buttonSecondaryPressed : null,
                  user.status !== 1 || user.roleId === 2
                    ? styles.actionDisabled
                    : null,
                ]}
              >
                <Text style={appStyles.buttonSecondaryText}>Hacer admin</Text>
              </Pressable>

              <Pressable
                disabled={user.status !== 1 || user.id === currentUserId}
                onPress={() => onDeactivateUser(user)}
                style={({ pressed }: PressableStateCallbackType) => [
                  appStyles.buttonGhost,
                  styles.userActionButton,
                  pressed ? appStyles.buttonGhostPressed : null,
                  user.status !== 1 || user.id === currentUserId
                    ? styles.actionDisabled
                    : null,
                ]}
              >
                <Text style={appStyles.buttonGhostText}>Inactivar</Text>
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
  const items: Array<{ id: AdminTab; label: string; icon: string }> = [
    { id: "home", label: "Inicio", icon: "⌂" },
    { id: "users", label: "Usuarios", icon: "▦" },
    { id: "profile", label: "Perfil", icon: "◉" },
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
            <Text style={[styles.navIcon, isActive ? styles.navIconActive : null]}>
              {item.icon}
            </Text>
            <Text style={[styles.navText, isActive ? styles.navTextActive : null]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
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
    alignItems: "flex-end",
    gap: 26,
    marginTop: 14,
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
    marginLeft: "auto",
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
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rolePillText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
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
  navIcon: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 25,
    fontWeight: "800",
  },
  navIconActive: {
    color: "#FFFFFF",
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
