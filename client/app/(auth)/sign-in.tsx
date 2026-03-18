import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignIn() {
    const router = useRouter()
    return (
        <SafeAreaView className="flex-1 bg-white" style={{ padding: 28 }}>
            <TouchableOpacity
                onPress={() => router.push("/")} className="absolute top-12 left-6 z-10"
            >
                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>
        </SafeAreaView>

    );
}