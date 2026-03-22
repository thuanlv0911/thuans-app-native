import { COLORS } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function AdminProducts() {
    const router = useRouter();
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [products, setProducts] = useState<any[]>([]);

    const groupedProducts = useMemo(() => {
        return products.reduce((groups: Record<string, any[]>, product: any) => {
            const categoryName = typeof product.category === "string" ? product.category : product.category?.name || "Others";

            if (!groups[categoryName]) {
                groups[categoryName] = [];
            }

            groups[categoryName].push(product);
            return groups;
        }, {});
    }, [products]);

    const sortedCategories = useMemo(
        () => Object.keys(groupedProducts).sort((first, second) => first.localeCompare(second)),
        [groupedProducts]
    );

    const fetchProducts = useCallback(async () => {
        try {
            const data = await apiRequest<{ products: any[] }>('/products?limit=100', { token });
            setProducts(data.products || []);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const performDelete = async (id: string) => {
        await apiRequest(`/products/${id}`, {
            method: "DELETE",
            token,
        });
        await fetchProducts();
    };

    const deleteProduct = async (id: string) => {
        Alert.alert(
            "Delete Product",
            "Are you sure you want to delete this product?",
            [
                { text: "Cancel", style: "cancel" as const },
                {
                    text: "Delete",
                    style: "destructive" as const,
                    onPress: () => performDelete(id),
                },
            ]
        );
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface">
            <View className="p-4 bg-white border border-gray-100 flex-row justify-between items-center">
                <Text className="text-lg font-semibold text-primary">Total Products ({products.length})</Text>
                <TouchableOpacity
                    onPress={() => router.push("/admin/products/add")}
                    className="bg-gray-800 px-4 py-2 rounded-full flex-row items-center"
                >
                    <Ionicons name="add" size={20} color="white" />
                    <Text className="text-white font-medium ml-1">Add Product</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 p-3"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {products.length === 0 ? (
                    <View className="flex-1 justify-center items-center mt-20">
                        <Text className="text-secondary">No products found</Text>
                    </View>
                ) : (
                    sortedCategories.map((categoryName) => (
                        <View key={categoryName} className="mb-5">
                            <View className="flex-row items-center justify-between mb-3 px-1">
                                <Text className="text-lg font-bold text-primary">{categoryName}</Text>
                                <View className="bg-primary/10 px-3 py-1 rounded-full">
                                    <Text className="text-primary text-xs font-bold">
                                        {groupedProducts[categoryName].length} products
                                    </Text>
                                </View>
                            </View>

                            {groupedProducts[categoryName].map((product: any) => (
                                <View key={product._id} className="bg-white p-3 rounded-lg border border-gray-100 mb-3 flex-row items-center">
                                    <Image
                                        source={{ uri: product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/150' }}
                                        className="w-16 h-16 rounded-lg bg-gray-100 mr-3"
                                        resizeMode="cover"
                                    />

                                    <View className="flex-1">
                                        <Text className="font-bold text-primary text-base" numberOfLines={1}>{product.name}</Text>
                                        <Text className="text-secondary text-xs mb-1" numberOfLines={1}>Stock: {product.stock}</Text>
                                        <Text className="text-secondary text-xs mb-1" numberOfLines={1}>Sizes: {(product.sizes || []).join(", ") || "-"}</Text>
                                        <Text className="text-primary font-bold">${product.price.toFixed(2)}</Text>
                                    </View>

                                    <View className="flex-row items-center">
                                        <TouchableOpacity
                                            onPress={() => router.push(`/admin/products/edit/${product._id}`)}
                                            className="p-2 bg-slate-50 rounded-full mr-2"
                                        >
                                            <Ionicons name="create-outline" size={18} color="#333333" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => deleteProduct(product._id)}
                                            className="p-2 bg-gray-50 rounded-full"
                                        >
                                            <Ionicons name="trash-outline" size={18} color="#333333" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))
                )}
            </ScrollView>
        </View>
    );
}
