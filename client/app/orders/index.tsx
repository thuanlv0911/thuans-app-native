
import { COLORS, getStatusColor } from "@/constants/theme";
import AuthRequiredState from "@/src/components/AuthRequiredState";
import Header from "@/src/components/Header";
import { formatDate } from "@/src/constants";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { Order } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Orders() {
    const router = useRouter();
    const { isAuthenticated, token } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            const data = await apiRequest<{ orders: Order[] }>('/orders', { token });
            setOrders(data.orders || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        fetchOrders();
    }, [isAuthenticated]);

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="My Orders" showBack />

            {!isAuthenticated ? (
                <AuthRequiredState
                    title="Order can dang nhap"
                    description="Dang nhap de xem don hang va lich su mua sam cua ban."
                />
            ) : loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : orders.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                    <Text className="text-secondary text-lg">No orders found</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item, index }) => (
                        <TouchableOpacity
                            className="bg-white p-4 rounded-xl mb-4 border border-gray-100 shadow-sm"
                            onPress={() => router.push(`/orders/${item._id}`)}
                        >
                            <View className="flex-row justify-between mb-2">
                                <Text className="text-primary font-bold">Order #{item.orderNumber}</Text>
                                <Text className="text-secondary text-sm">{formatDate(item.createdAt)}</Text>
                            </View>

                            {/* Status Badges */}
                            <View className="flex-row gap-2 mb-3">
                                <View className={`px-2 py-1 rounded-full ${getStatusColor(item.orderStatus)}`}>
                                    <Text className={`text-xs font-bold capitalize`}>
                                        {item.orderStatus}
                                    </Text>
                                </View>

                                <View className={`px-2 py-1 rounded-full ${item.paymentStatus === 'paid' ? 'bg-green-100' : 'bg-gray-100'
                                    }`}>
                                    <Text className={`text-xs font-bold capitalize ${item.paymentStatus === 'paid' ? 'text-green-700' : 'text-gray-700'
                                        }`}>
                                        {item.paymentStatus}
                                    </Text>
                                </View>
                            </View>

                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-secondary text-xs">Payment Method: <Text className="text-primary font-medium capitalize">{item.paymentMethod}</Text></Text>
                            </View>

                            {/* Product Images */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                                {item.items.map((prod: any, idx) => {
                                    const image = prod.image || prod.product?.images?.[0];
                                    return (
                                        <View key={idx} className="mr-3 border border-gray-100 rounded-md p-1 bg-gray-50">
                                            {image ? (
                                                <Image
                                                    source={{ uri: image }}
                                                    className="w-12 h-12 rounded-md"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View className="w-12 h-12 bg-gray-200 rounded-md justify-center items-center">
                                                    <Ionicons name="image-outline" size={20} color={COLORS.secondary} />
                                                </View>
                                            )}
                                        </View>
                                    );
                                })}
                            </ScrollView>

                            <View className="flex-row justify-between items-center mt-2 pt-3 border-t border-gray-100">
                                <Text className="text-secondary">Items: {item.items.length}</Text>
                                <Text className="text-primary font-bold text-lg">${item.totalAmount.toFixed(2)}</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}
