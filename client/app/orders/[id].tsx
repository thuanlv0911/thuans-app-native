import { COLORS } from "@/constants/theme";
import AuthRequiredState from "@/src/components/AuthRequiredState";
import Header from "@/src/components/Header";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { Order, Product } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function OrderDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { isAuthenticated, token } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<"pay" | "confirm" | null>(null);

    const fetchOrderDetails = useCallback(async () => {
        try {
            const data = await apiRequest<{ order: Order }>(`/orders/${id}`, { token });
            setOrder(data.order);
        } finally {
            setLoading(false);
        }
    }, [id, token]);

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        fetchOrderDetails();
    }, [fetchOrderDetails, isAuthenticated]);

    const formatDate = (dateString?: string) => {
        if (!dateString) {
            return "";
        }

        const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handlePayOrder = async () => {
        if (!order) {
            return;
        }

        setActionLoading("pay");
        try {
            const data = await apiRequest<{ order: Order }>(`/orders/${order._id}/pay`, {
                method: "PATCH",
                token,
            });
            setOrder(data.order);
            Toast.show({
                type: "success",
                text1: "Payment confirmed",
                text2: "Your order payment has been marked as paid.",
            });
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Payment failed",
                text2: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleConfirmReceived = async () => {
        if (!order) {
            return;
        }

        setActionLoading("confirm");
        try {
            const data = await apiRequest<{ order: Order }>(`/orders/${order._id}/confirm-received`, {
                method: "PATCH",
                token,
            });
            setOrder(data.order);
            Toast.show({
                type: "success",
                text1: "Order confirmed",
                text2: "Thank you for confirming receipt.",
            });
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Confirm failed",
                text2: error instanceof Error ? error.message : "Please try again.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    const canPay = useMemo(
        () => order?.orderStatus === "delivered" && order.paymentStatus !== "paid",
        [order]
    );

    const canConfirmReceived = useMemo(
        () => order?.orderStatus === "delivered" && order.paymentStatus === "paid" && !order.customerConfirmedAt,
        [order]
    );

    if (!isAuthenticated) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                <Header title="Order Detail" showBack />
                <AuthRequiredState
                    title="Order detail can dang nhap"
                    description="Dang nhap de xem chi tiet don hang cua ban."
                />
            </SafeAreaView>
        );
    }

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-surface justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView className="flex-1 bg-surface justify-center items-center">
                <Text>Order not found</Text>
            </SafeAreaView>
        );
    }

    const ORDER_STEPS = [
        { title: "Order Placed", date: formatDate(order.createdAt), completed: true },
        { title: "Processing", date: "", completed: ['processing', 'shipped', 'delivered'].includes(order.orderStatus) },
        { title: "Shipped", date: "", completed: ['shipped', 'delivered'].includes(order.orderStatus) },
        { title: "Delivered", date: formatDate(order.deliveredAt), completed: order.orderStatus === 'delivered' },
    ];

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title={`Order #${order.orderNumber}`} showBack />
            <ScrollView className="flex-1 px-4 pt-4">
                <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100">
                    <Text className="text-lg font-bold text-primary mb-4">Order Status</Text>

                    {ORDER_STEPS.map((step, index) => (
                        <View key={index} className="flex-row mb-4 last:mb-0">
                            <View className="items-center mr-4">
                                <View className={`w-3 h-3 rounded-full ${step.completed ? 'bg-primary' : 'bg-gray-300'}`} />
                                {index !== ORDER_STEPS.length - 1 && (
                                    <View className={`w-0.5 h-full ${step.completed ? 'bg-primary' : 'bg-gray-300'} absolute top-3`} />
                                )}
                            </View>
                            <View className="pb-4">
                                <Text className={`font-bold ${step.completed ? 'text-primary' : 'text-gray-400'}`}>{step.title}</Text>
                                {step.date ? <Text className="text-secondary text-xs">{step.date}</Text> : null}
                            </View>
                        </View>
                    ))}
                </View>

                {(canPay || canConfirmReceived || order.customerConfirmedAt) && (
                    <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100">
                        <Text className="text-lg font-bold text-primary mb-4">Delivery Actions</Text>
                        <Text className="text-secondary mb-4">
                            {order.paymentMethod === "cash"
                                ? "For cash on delivery, confirm payment after you receive the package."
                                : "Card payment is simulated in this project, so you can confirm payment after delivery."}
                        </Text>

                        {canPay && (
                            <TouchableOpacity
                                className={`bg-primary rounded-xl py-4 items-center mb-3 ${actionLoading === 'pay' ? 'opacity-70' : ''}`}
                                onPress={handlePayOrder}
                                disabled={actionLoading !== null}
                            >
                                {actionLoading === 'pay' ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold">Confirm Payment</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {canConfirmReceived && (
                            <TouchableOpacity
                                className={`bg-green-600 rounded-xl py-4 items-center ${actionLoading === 'confirm' ? 'opacity-70' : ''}`}
                                onPress={handleConfirmReceived}
                                disabled={actionLoading !== null}
                            >
                                {actionLoading === 'confirm' ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold">Confirm Received</Text>
                                )}
                            </TouchableOpacity>
                        )}

                        {order.customerConfirmedAt && (
                            <View className="bg-green-50 border border-green-100 rounded-xl p-4">
                                <Text className="text-green-700 font-bold">Received confirmed</Text>
                                <Text className="text-green-700 text-sm mt-1">
                                    {formatDate(order.customerConfirmedAt)}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100">
                    <Text className="text-lg font-bold text-primary mb-4">Products</Text>
                    {order.items.map((item: any, index: number) => {
                        const productData = item.product as Product;
                        const image = item.image || productData?.images?.[0];

                        return (
                            <View key={index} className={`flex-row ${index !== order.items.length - 1 ? 'border-b border-gray-100 pb-4 mb-4' : ''}`}>
                                {image ? <Image source={{ uri: image }} className="w-16 h-16 rounded-lg bg-gray-100" resizeMode="contain" /> : null}
                                <View className="flex-1 ml-3 justify-center">
                                    <Text className="text-primary font-medium" numberOfLines={1}>{item.name}</Text>
                                    <Text className="text-secondary text-xs">Size: {item.size}</Text>
                                    <View className="flex-row justify-between items-center mt-2">
                                        <Text className="text-primary font-bold">${item.price}</Text>
                                        <Text className="text-secondary text-xs">Qty: {item.quantity}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

                <View className="bg-white p-4 rounded-xl mb-4 border border-gray-100">
                    <Text className="text-lg font-bold text-primary mb-2">Shipping Details</Text>
                    <View className="flex-row items-center mb-2">
                        <Ionicons name="location-outline" size={20} color={COLORS.secondary} />
                        <Text className="text-secondary ml-2 flex-1">
                            {order.shippingAddress?.thonToDanPho}, {order.shippingAddress?.xaPhuong}
                            {order.shippingAddress?.quanHuyen ? `, ${order.shippingAddress.quanHuyen}` : ''}
                            , {order.shippingAddress?.tinhThanh}
                        </Text>
                    </View>
                </View>

                <View className="bg-white p-4 rounded-xl mb-8 border border-gray-100">
                    <Text className="text-lg font-bold text-primary mb-4">Payment Summary</Text>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-secondary">Payment Method</Text>
                        <Text className="text-primary font-medium capitalize">{order.paymentMethod}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-secondary">Payment Status</Text>
                        <Text className={`font-medium capitalize ${order.paymentStatus === 'paid' ? 'text-green-600' : order.paymentStatus === 'failed' ? 'text-red-600' : 'text-orange-500'}`}>
                            {order.paymentStatus}
                        </Text>
                    </View>
                    <View className="h-px bg-gray-100 my-2" />
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-secondary">Subtotal</Text>
                        <Text className="text-primary font-medium">${order.subtotal.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-secondary">Shipping</Text>
                        <Text className="text-primary font-medium">${order.shippingCost.toFixed(2)}</Text>
                    </View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="text-secondary">Tax</Text>
                        <Text className="text-primary font-medium">${order.tax.toFixed(2)}</Text>
                    </View>
                    <View className="h-px bg-gray-100 my-2" />
                    <View className="flex-row justify-between">
                        <Text className="text-primary font-bold text-lg">Total</Text>
                        <Text className="text-primary font-bold text-lg">${order.totalAmount.toFixed(2)}</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
