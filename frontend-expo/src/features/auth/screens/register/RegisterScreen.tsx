import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  type PressableStateCallbackType,
  Text,
  View,
} from "react-native";

import { FormField } from "../../../../components/FormField";
import { SelectField } from "../../../app/components/SelectField";
import { authStyles } from "../../shared/auth.styles";
import { createAdminManagedUser, registerUser } from "./register.api";
import {
  type RegisterFormValues,
  registerSchema,
} from "./register.schema";

interface RegisterScreenProps {
  isAdminMode?: boolean;
  onCancel?: () => void;
  onGoToLogin?: () => void;
  onRegisterSuccess: (email: string, message: string) => void;
}

export function RegisterScreen({
  isAdminMode = false,
  onCancel,
  onGoToLogin,
  onRegisterSuccess,
}: RegisterScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
    reset,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    shouldUnregister: true,
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      age: "",
      nickname: "",
      roleId: "1",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const normalizedEmail = values.email.trim().toLowerCase();
      const payload = {
        fullName: values.fullName.trim(),
        email: normalizedEmail,
        password: values.password,
        age: Number(values.age),
        nickname: values.nickname.trim(),
      };

      const successMessage = isAdminMode
        ? (
            await createAdminManagedUser({
              ...payload,
              roleId: Number(values.roleId ?? "1"),
            })
          ).message
        : `${
            (await registerUser(payload)).user.nickname
          }, tu cuenta fue creada correctamente. Ahora puedes iniciar sesion.`;

      reset({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        age: "",
        nickname: "",
        roleId: "1",
      });

      onRegisterSuccess(
        normalizedEmail,
        successMessage,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ocurrio un error inesperado.";

      Alert.alert("Registro no completado", message);
    }
  });

  return (
    <View style={authStyles.formCard}>
      <Text style={authStyles.formTitle}>Registrarse</Text>
      <Text style={authStyles.formSubtitle}>
        Crea tu cuenta para empezar el control de gastos del MVP.
      </Text>

      <FormField
        autoCapitalize="words"
        control={control}
        label="Nombre completo"
        name="fullName"
        placeholder="Ej: Ana Maria Perez"
      />

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
        placeholder="Minimo 8 caracteres"
        secureTextEntry
        showToggle
      />

      <FormField
        autoCapitalize="none"
        control={control}
        isVisible={showConfirmPassword}
        label="Confirmar contrasena"
        name="confirmPassword"
        onToggleVisibility={() =>
          setShowConfirmPassword((current) => !current)
        }
        placeholder="Repite la contrasena"
        secureTextEntry
        showToggle
      />

      <FormField
        autoCapitalize="none"
        control={control}
        inputMode="numeric"
        keyboardType="number-pad"
        label="Edad"
        name="age"
        placeholder="Ej: 25"
      />

      <FormField
        autoCapitalize="words"
        control={control}
        label="Nickname"
        name="nickname"
        placeholder="Ej: anita_ahorra"
      />

      {isAdminMode ? (
        <SelectField
          control={control}
          label="Rol"
          name="roleId"
          options={[
            { label: "Usuario general", value: "1" },
            { label: "Administrador", value: "2" },
          ]}
          placeholder="Selecciona el rol"
        />
      ) : null}

      <Pressable
        disabled={isSubmitting}
        onPress={onSubmit}
        style={({ pressed }: PressableStateCallbackType) => [
          authStyles.submitButton,
          pressed ? authStyles.submitButtonPressed : null,
          isSubmitting ? authStyles.submitButtonDisabled : null,
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={authStyles.submitButtonText}>Crear cuenta</Text>
        )}
      </Pressable>

      {isAdminMode ? (
        <Text onPress={onCancel} style={authStyles.footerText}>
          Cancelar y volver a usuarios
        </Text>
      ) : (
        <Text style={authStyles.footerText}>
          Ya tienes cuenta?{" "}
          <Text onPress={onGoToLogin} style={authStyles.footerLink}>
            Inicia sesion aqui
          </Text>
        </Text>
      )}
    </View>
  );
}
