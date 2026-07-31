import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomButton from "@/shared/components/CustomButton";
import GoogleSignInButton from "@/modules/auth/components/GoogleSignInButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { signUp, signInGoogle, selectAuthIsLoading } from "@/store/authSlice";
import { isGoogleSignInConfigured } from "@/shared/services/firebase";

export default function SignUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthIsLoading);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Missing info", "All fields are required.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Use at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const result = await dispatch(signUp({ email: email.trim(), password, name: name.trim() }));
      if (signUp.rejected.match(result)) throw new Error(result.payload as string);
    } catch (e: any) {
      Alert.alert("Sign up failed", e?.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    try {
      const result = await dispatch(signInGoogle());
      if (signInGoogle.rejected.match(result)) throw new Error(result.payload as string);
    } catch (e: any) {
      Alert.alert("Google sign in failed", e?.message ?? "Please try again.");
    } finally {
      setGoogleBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-pink-50">
      <View className="flex-1 px-6" style={{ paddingTop: insets.top + 40 }}>
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-pink-500 rounded-full items-center justify-center mb-4">
            <Ionicons name="calendar" size={36} color="white" />
          </View>
          <Text className="text-3xl font-lexend-bold text-gray-900">
            Cycle Diary
          </Text>
        </View>

        {!isGoogleSignInConfigured && (
          <View className="bg-amber-100 border border-amber-300 rounded-xl p-3 mb-4">
            <Text className="text-amber-800 font-lexend text-xs">
              Google Sign-In is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env to enable it.
            </Text>
          </View>
        )}

        <View className="bg-white rounded-2xl p-6 shadow-sm">
          <Text className="text-xl font-lexend-bold text-gray-900 mb-6">
            Create Account
          </Text>

          <Text className="text-gray-500 font-lexend text-sm mb-1">Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor="#9ca3af"
            className="bg-gray-100 rounded-xl px-4 py-3 font-lexend text-gray-900 mb-4"
          />

          <Text className="text-gray-500 font-lexend text-sm mb-1">Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            keyboardType="email-address"
            className="bg-gray-100 rounded-xl px-4 py-3 font-lexend text-gray-900 mb-4"
          />

          <Text className="text-gray-500 font-lexend text-sm mb-1">Password</Text>
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 mb-6">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              className="flex-1 py-3 font-lexend text-gray-900"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#9ca3af"
              />
            </Pressable>
          </View>

          <CustomButton
            title={busy || isLoading ? "Creating..." : "Create Account"}
            onPress={handleSignUp}
            disabled={busy || isLoading}
          />
          {(busy || isLoading) && (
            <ActivityIndicator color="#ec4899" className="mt-3" />
          )}

          <View className="flex-row items-center my-5">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="mx-3 text-gray-400 font-lexend text-xs">OR</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          <GoogleSignInButton
            onPress={handleGoogleSignIn}
            loading={googleBusy}
            disabled={!isGoogleSignInConfigured}
            label="Sign up with Google"
          />
        </View>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500 font-lexend">
            Already have an account?{" "}
          </Text>
          <Pressable onPress={() => router.back()}>
            <Text className="text-pink-500 font-lexend-semibold">Sign In</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
