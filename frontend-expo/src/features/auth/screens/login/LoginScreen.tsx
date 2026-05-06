import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from "react-native";

import { FormField } from "../../../../components/FormField";
import { authStyles } from "../../shared/auth.styles";
import { loginUser } from "./login.api";
import {
  type LoginFormValues,
  loginSchema,
} from "./login.schema";
import { type HomeData } from "../home/home.types";

interface LoginScreenProps {
  initialEmail?: string;
  registerNotice: string | null;
  onLoginSuccess: (session: HomeData) => void;
  onGoToRegister: () => void;
}

export function LoginScreen({
  initialEmail = "",
  registerNotice,
  onLoginSuccess,
  onGoToRegister,
}: LoginScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    shouldUnregister: true,
    defaultValues: {
      email: initialEmail,
      password: "",
    },
  });

  useEffect(() => {
    reset({
      email: initialEmail,
      password: "",
    });
  }, [initialEmail, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await loginUser({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      reset({
        email: values.email.trim().toLowerCase(),
        password: "",
      });
      onLoginSuccess(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ocurrio un error inesperado.";

      Alert.alert("Login no completado", message);
    }
  });

  return (
    <View style={authStyles.formCard}>
      <Text style={authStyles.formTitle}>Iniciar sesion</Text>
      <Text style={authStyles.formSubtitle}>
        Ingresa con tu correo y contrasena para continuar.
      </Text>

      {registerNotice ? (
        <View style={authStyles.successBox}>
          <Text style={authStyles.successTitle}>Registro exitoso</Text>
          <Text style={authStyles.successMessage}>{registerNotice}</Text>
        </View>
      ) : null}

      <FormField
        autoCapitalize="none"
        control={control}
        inputMode="email"
        keyboardType="email-address"
        label="Correo electronico"
        name="email"
        placeholder="correo@ejemplo.com"
      />

      <FormField
        autoCapitalize="none"
        control={control}
        isVisible={showPassword}
        label="Contrasena"
        name="password"
        onToggleVisibility={() => setShowPassword((current) => !current)}
        placeholder="Ingresa tu contrasena"
        secureTextEntry
        showToggle
      />

      <Pressable
        onPress={() =>
          Alert.alert(
            "Recuperacion pendiente",
            "El flujo de olvide mi contrasena queda para la siguiente iteracion.",
          )
        }
      >
        <Text style={authStyles.helperLink}>Olvide mi contrasena</Text>
      </Pressable>

      <Pressable
        disabled={isSubmitting}
        onPress={onSubmit}
        style={({ pressed }) => [
          authStyles.submitButton,
          pressed ? authStyles.submitButtonPressed : null,
          isSubmitting ? authStyles.submitButtonDisabled : null,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.submitButtonText}>Ingresar</Text>
        )}
      </Pressable>

      <Text style={authStyles.footerText}>
        ¿No tienes una cuenta?{" "}
        <Text onPress={onGoToRegister} style={authStyles.footerLink}>
          Registrate aqui
        </Text>
      </Text>
    </View>
  );
}
