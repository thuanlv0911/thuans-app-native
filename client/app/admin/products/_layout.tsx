import { COLORS } from "@/constants/theme";
import { Stack } from "expo-router";

export default function ProductsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: "#fff" },
                headerTintColor: COLORS.primary,
                headerTitleStyle: { fontWeight: "bold" },
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" options={{ title: "", headerShown: false }} />
            <Stack.Screen name="add" options={{ title: "Add Product" }} />
            <Stack.Screen name="edit/[id]" options={{ title: "Edit Product" }} />
        </Stack>
    );
}
