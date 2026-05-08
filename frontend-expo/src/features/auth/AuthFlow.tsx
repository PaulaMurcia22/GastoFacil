import { useState } from "react";

import { HomeScreen } from "./screens/home/HomeScreen";
import { AdminScreen } from "./screens/home/AdminScreen";
import { type HomeData } from "./screens/home/home.types";
import { LoginScreen } from "./screens/login/LoginScreen";
import { RegisterScreen } from "./screens/register/RegisterScreen";

type AuthView = "login" | "register";

export function AuthFlow() {
  const [activeView, setActiveView] = useState<AuthView>("login");
  const [session, setSession] = useState<HomeData | null>(null);
  const [registerNotice, setRegisterNotice] = useState<string | null>(null);
  const [prefilledEmail, setPrefilledEmail] = useState("");

  if (session) {
    const role = session.user.id_rol ?? session.user.idRol ?? 1;
    if (role === 2) {
      return (
        <AdminScreen session={session} onCloseSession={() => setSession(null)} />
      );
    }

    return (
      <HomeScreen onCloseSession={() => setSession(null)} session={session} />
    );
  }

  if (activeView === "register") {
    return (
      <RegisterScreen
        onGoToLogin={() => {
          setActiveView("login");
        }}
        onRegisterSuccess={(email, message) => {
          setPrefilledEmail(email);
          setRegisterNotice(message);
          setActiveView("login");
        }}
      />
    );
  }

  return (
    <LoginScreen
      initialEmail={prefilledEmail}
      onGoToRegister={() => {
        setRegisterNotice(null);
        setActiveView("register");
      }}
      onLoginSuccess={(nextSession) => {
        setSession(nextSession);
        setRegisterNotice(null);
      }}
      registerNotice={registerNotice}
    />
  );
}
