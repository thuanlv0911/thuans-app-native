import { COLORS } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUp() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Toast.show({ type: "error", text1: "Missing information", text2: "Please fill in your full name, email, and password." }); return;
        }

        if (!EMAIL_REGEX.test(email.trim())) {
            Toast.show({ type: "error", text1: "Invalid email", text2: "Please enter a valid email address." }); return;
        }

        if (password !== confirmPassword) {
            Toast.show({ type: "error", text1: "Password does not match", text2: "Please re-enter your password to confirm." }); return;
        }

        if (password.length < 6) {
            Toast.show({ type: "error", text1: "Password is too short", text2: "Password must be at least 6 characters long." }); return;
        }

        try {
            setSubmitting(true);
            const signedUser = await signUp(name.trim(), email.trim(), password);
            Toast.show({ type: "success", text1: "Account created successfully" });
            router.replace(signedUser.role === "admin" ? "/admin" : "/(tabs)/profile");
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Registration failed",

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
                <Text className="text-3xl font-bold text-primary mb-2">Create Account</Text>
                <Text className="text-base text-secondary mb-10">
                    Hi guys
                </Text>

                <View className="gap-6">
                    <View>
                        <Text className="text-primary font-medium mb-2">Username</Text>
                        <TextInput
                            className="w-full bg-surface p-4 rounded-xl text-primary"
                            placeholder="Nguyễn Văn A"
                            placeholderTextColor="#999"
                            value={name}
                            onChangeText={setName}
                            editable={!submitting}
                        />
                    </View>

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
                            placeholder="******"
                            placeholderTextColor="#999"
                            secureTextEntry
                            value={password}
                            onChangeText={setPassword}
                            editable={!submitting}
                        />
                    </View>

                    <View>
                        <Text className="text-primary font-medium mb-2">Confirm password</Text>
                        <TextInput
                            className="w-full bg-surface p-4 rounded-xl text-primary"
                            placeholder="******"
                            placeholderTextColor="#999"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
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
                        <Text className="text-white font-bold text-lg">Register</Text>
                    )}
                </TouchableOpacity>

                <View className="mt-6 flex-row justify-center">
                    <Text className="text-secondary">Already have an account? </Text>
                    <Link href="/sign-in" asChild>
                        <TouchableOpacity>
                            <Text className="text-primary font-bold">Login</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </View>
        </SafeAreaView>
    );
}
