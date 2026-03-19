import { COLORS } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function SignIn() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            Toast.show({ type: "error", text1: "Missing information", text2: "Please enter your email and password." }); return;
        }

        try {
            setSubmitting(true);
            const signedUser = await signIn(email.trim(), password);
            Toast.show({ type: "success", text1: "Login successfully" });
            router.replace(signedUser.role === "admin" ? "/admin" : "/(tabs)/profile");
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Login failed",
                text2: error instanceof Error ? error.message : "An error occurred, please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white" style={{ padding: 28 }}>
            <TouchableOpacity
                onPress={() => router.push("/")}
                className="absolute top-12 left-6 z-10"
            >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <View className="flex-1 justify-center">
                <Text className="text-3xl font-bold text-primary mb-2">Welcome Back</Text>
                <Text className="text-base text-secondary mb-10">
                    Hi guys
                </Text>

                {/* Error  */}

                <View className="gap-6">
                    <View>
                        <Text className="text-primary font-medium mb-2">Email</Text>
                        <TextInput
                            className="w-full bg-surface p-4 rounded-xl text-primary"
                            placeholder="you@example.com"
                            placeholderTextColor="#999"
                            autoCapitalize="none"
                            keyboardType="email-address"
                            value={email}
                            onChangeText={setEmail}
                            editable={!submitting}
                        />
                    </View>

                    <View>
                        <Text className="text-primary font-medium mb-2">Password</Text>
                        <TextInput
                            className="w-full bg-surface p-4 rounded-xl text-primary"
                            placeholder="••••••••"
                            placeholderTextColor="#999"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!submitting}
                        />
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={submitting}
                    className={`mt-8 w-full py-4 rounded-full items-center ${submitting ? "bg-gray-300" : "bg-primary"
                        }`}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Login</Text>
                    )}
                </TouchableOpacity>

                <View className="mt-6 flex-row justify-center">
                    <Text className="text-secondary">Do not have an account? </Text>
                    <Link href="/sign-up" asChild>
                        <TouchableOpacity>
                            <Text className="text-primary font-bold">Register</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
