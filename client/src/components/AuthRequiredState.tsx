import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type AuthRequiredStateProps = {
  title: string;
  description: string;
};

export default function AuthRequiredState({ title, description }: AuthRequiredStateProps) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Ionicons name="lock-closed-outline" size={56} color={COLORS.secondary} />
      <Text className="mt-5 text-center text-2xl font-bold text-primary">{title}</Text>
      <Text className="mt-3 text-center text-base leading-6 text-secondary">{description}</Text>

      <TouchableOpacity
        onPress={() => router.push("/sign-in")}
        className="mt-8 w-full items-center rounded-full bg-primary py-4"
      >
        <Text className="text-base font-bold text-white">Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/sign-up")}
        className="mt-4 w-full items-center rounded-full border border-gray-300 py-4"
      >
        <Text className="text-base font-semibold text-primary">Register</Text>
      </TouchableOpacity>
    </View>
  );
}
