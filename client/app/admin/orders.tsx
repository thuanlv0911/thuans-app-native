import { COLORS, getStatusColor } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { Order } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import Toast from "react-native-toast-message";

type OrderStatus = Order["orderStatus"];

const STATUS_FLOW: OrderStatus[] = ["placed", "processing", "shipped", "delivered"];
const STATUSES: OrderStatus[] = ["placed", "processing", "shipped", "delivered", "cancelled"];

const isOrderLocked = (order: Order) =>
    order.orderStatus === "cancelled" ||
    (order.orderStatus === "delivered" && order.paymentStatus === "paid" && Boolean(order.customerConfirmedAt));

const getNextAllowedStatuses = (order: Order): OrderStatus[] => {
    if (order.orderStatus === "cancelled" || order.orderStatus === "delivered") {
        return [];
    }

    const currentIndex = STATUS_FLOW.indexOf(order.orderStatus);

    if (currentIndex === -1) {
        return [];
    }

    const nextStatus = STATUS_FLOW[currentIndex + 1];
    return nextStatus ? [nextStatus, "cancelled"] : ["cancelled"];
};

const getLockedReason = (order: Order) => {
    if (order.orderStatus === "cancelled") {
        return "Cancelled orders cannot be updated.";
    }

    if (order.orderStatus === "delivered" && order.paymentStatus === "paid" && order.customerConfirmedAt) {
        return "This order was delivered, paid, and confirmed by the customer, so it can no longer be updated.";
    }

    if (order.orderStatus === "delivered") {
        return "Delivered orders cannot move to another status.";
    }

    return "This order cannot be updated.";
};

const getCustomerName = (order: Order) =>
    typeof order.user === "string" ? "Unknown User" : order.user?.name || "Unknown User";

const getCustomerEmail = (order: Order) =>
    typeof order.user === "string" ? "No email" : order.user?.email || "No email";

const getItemLabel = (item: Order["items"][number]) =>
    typeof item.product === "string" ? item.name : item.product?.name || item.name;

export default function AdminOrders() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);

    // Status Modal State
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updating, setUpdating] = useState(false);

    const fetchOrders = async () => {
        try {
            const data = await apiRequest<{ orders: Order[] }>("/admin/orders", { token });
            setOrders(data.orders || []);
        } catch (error) {
            console.error("Failed to fetch admin orders:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const openStatusModal = (order: Order) => {
        if (isOrderLocked(order)) {
            Toast.show({
                type: "info",
                text1: "Cannot update order",
                text2: getLockedReason(order),
            });
            return;
        }

        setSelectedOrder(order);
        setStatusModalVisible(true);
    };

    const performUpdateStatus = async (newStatus: OrderStatus) => {
        if (!selectedOrder) return;

        setUpdating(true);

        try {
            const data = await apiRequest<{ order: Order }>(`/admin/orders/${selectedOrder._id}/status`, {
                method: "PATCH",
                token,
                body: { orderStatus: newStatus },
            });

            setOrders((currentOrders) =>
                currentOrders.map((order) =>
                    order._id === selectedOrder._id ? data.order : order
                )
            );
            setSelectedOrder(data.order);
            setStatusModalVisible(false);
            Toast.show({
                type: "success",
                text1: "Status updated",
                text2: `Order moved to ${data.order.orderStatus}.`,
            });
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Update failed",
                text2: error instanceof Error ? error.message : "Please try again.",
            });
            console.error("Failed to update order status:", error);
        } finally {
            setUpdating(false);
        }
    };

    const updateStatus = (newStatus: OrderStatus) => {
        if (!selectedOrder) {
            return;
        }

        if (newStatus === "cancelled") {
            Alert.alert(
                "Cancel order",
                "Are you sure you want to cancel this order? This action cannot be undone.",
                [
                    { text: "Keep order", style: "cancel" },
                    {
                        text: "Cancel order",
                        style: "destructive",
                        onPress: () => performUpdateStatus(newStatus),
                    },
                ]
            );
            return;
        }

        performUpdateStatus(newStatus);
    };

    const availableStatuses = selectedOrder ? STATUSES.filter((status) => {
        if (status === selectedOrder.orderStatus) {
            return true;
        }

        return getNextAllowedStatuses(selectedOrder).includes(status);
    }) : [];

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-surface">
            <ScrollView
                className="flex-1 p-4"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {orders.length === 0 ? (
                    <View className="flex-1 justify-center items-center mt-20">
                        <Text className="text-secondary">No orders found</Text>
                    </View>
                ) : (
                    orders.map((order) => (
                        <View key={order._id} className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100">
                            <View className="flex-row justify-between mb-2">
                                <Text className="font-medium text-sm text-gray-400 ">Order ID : #{order._id}</Text>
                                <Text className="text-secondary text-xs">{new Date(order.createdAt).toLocaleDateString()}</Text>
                            </View>

                            <View className="mb-3 bg-gray-50 p-3 rounded-lg">
                                <Text className="text-xs text-secondary font-bold mb-1">CUSTOMER</Text>
                                <Text className="text-primary font-medium">{getCustomerName(order)}</Text>
                                <Text className="text-secondary text-xs">{getCustomerEmail(order)}</Text>
                            </View>

                            <View className="mb-3 bg-gray-50 p-3 rounded-lg">
                                <Text className="text-xs text-secondary font-bold mb-1">SHIPPING ADDRESS</Text>
                                <Text className="text-primary text-xs">
                                    {order.shippingAddress?.thonToDanPho}, {order.shippingAddress?.xaPhuong}
                                    {order.shippingAddress?.quanHuyen ? `, ${order.shippingAddress.quanHuyen}` : ''}
                                </Text>
                                <Text className="text-primary text-xs">
                                    {order.shippingAddress?.tinhThanh}
                                </Text>
                            </View>

                            <View className="mb-3">
                                <Text className="text-xs text-secondary font-bold mb-2">ITEMS</Text>
                                {order.items.map((item, index) => (
                                    <View key={`${order._id}-${index}`} className="flex-row justify-between mb-1">
                                        <Text className="text-secondary text-xs flex-1">
                                            {item.quantity}x {getItemLabel(item)}
                                            {(item.size) && (
                                                <Text className="text-gray-400">
                                                    {" "}({item.size || '-'})
                                                </Text>
                                            )}
                                        </Text>
                                        <Text className="text-secondary text-xs font-bold">
                                            ${item.price.toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View className="flex-row justify-between items-center mt-2 pt-3 border-t border-gray-100">
                                <Text className="text-primary font-bold text-lg">${order.totalAmount.toFixed(2)}</Text>

                                <TouchableOpacity
                                    onPress={() => openStatusModal(order)}
                                    disabled={isOrderLocked(order)}
                                    className={`flex-row items-center px-4 py-2 rounded-full ${getStatusColor(order.orderStatus)} ${isOrderLocked(order) ? "opacity-60" : ""}`}
                                >
                                    <Text className="text-xs font-bold mr-2 uppercase tracking-wide">{order.orderStatus}</Text>
                                    {!isOrderLocked(order) ? (
                                        <Ionicons name="pencil" size={12} color="black" style={{ opacity: 0.5 }} />
                                    ) : (
                                        <Ionicons name="lock-closed" size={12} color="black" style={{ opacity: 0.5 }} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* STATUS MODAL */}
            <Modal visible={statusModalVisible} animationType="fade" transparent>
                <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
                    <View className="flex-1 justify-end bg-black/50">
                        <View className="bg-white rounded-t-2xl p-4 max-h-[60%]">
                            <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                                <Text className="text-lg font-bold text-primary">
                                    Update Order Status
                                </Text>
                                <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                                    <Ionicons name="close" size={24} color={COLORS.secondary} />
                                </TouchableOpacity>
                            </View>

                            {updating ? (
                                <View className="py-8">
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                    <Text className="text-center text-secondary mt-2">Updating status...</Text>
                                </View>
                            ) : (
                                <FlatList
                                    data={availableStatuses}
                                    keyExtractor={(item) => item}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            className={`p-4 rounded-xl mb-2 flex-row justify-between items-center ${selectedOrder?.orderStatus === item ? "bg-primary/10" : "bg-gray-50"
                                                }`}
                                            onPress={() => updateStatus(item)}
                                        >
                                            <Text className={`font-medium capitalize ${selectedOrder?.orderStatus === item ? "text-primary font-bold" : "text-secondary"
                                                }`}>
                                                {item}
                                            </Text>
                                            {selectedOrder?.orderStatus === item && (
                                                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                    ListFooterComponent={
                                        selectedOrder ? (
                                            <Text className="text-xs text-secondary mt-2 px-1">
                                                Orders can only move forward to the next delivery stage. Cancelled and fully completed orders are locked.
                                            </Text>
                                        ) : null
                                    }
                                />
                            )}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}
