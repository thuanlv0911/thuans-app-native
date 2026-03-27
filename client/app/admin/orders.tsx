import { COLORS, getStatusColor } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { Order } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import { 
    ActivityIndicator, 
    Alert, 
    FlatList, 
    Modal, 
    RefreshControl, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    TouchableWithoutFeedback, 
    View 
} from "react-native";
import Toast from "react-native-toast-message";

type OrderStatus = Order["orderStatus"];

const STATUS_FLOW: OrderStatus[] = ["placed", "processing", "shipped", "delivered"];
const STATUSES: OrderStatus[] = ["placed", "processing", "shipped", "delivered", "cancelled"];
const FILTER_STATUSES = ["all", ...STATUSES] as const;

const STATUS_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    placed: { icon: "time-outline", color: "#F59E0B" },
    processing: { icon: "cog-outline", color: "#6366F1" },
    shipped: { icon: "airplane-outline", color: "#8B5CF6" },
    delivered: { icon: "checkmark-circle-outline", color: "#10B981" },
    cancelled: { icon: "close-circle-outline", color: "#EF4444" },
};

const isOrderLocked = (order: Order) =>
    order.orderStatus === "cancelled" ||
    (order.orderStatus === "delivered" && order.paymentStatus === "paid" && Boolean(order.customerConfirmedAt));

const getNextAllowedStatuses = (order: Order): OrderStatus[] => {
    if (order.orderStatus === "cancelled" || order.orderStatus === "delivered") {
        return [];
    }
    const currentIndex = STATUS_FLOW.indexOf(order.orderStatus);
    if (currentIndex === -1) return [];
    const nextStatus = STATUS_FLOW[currentIndex + 1];
    return nextStatus ? [nextStatus, "cancelled"] : ["cancelled"];
};

const getLockedReason = (order: Order) => {
    if (order.orderStatus === "cancelled") return "Cancelled orders cannot be updated.";
    if (order.orderStatus === "delivered" && order.paymentStatus === "paid" && order.customerConfirmedAt) {
        return "Order completed and confirmed by customer.";
    }
    if (order.orderStatus === "delivered") return "Delivered orders cannot be changed.";
    return "This order cannot be updated.";
};

const getCustomerName = (order: Order) =>
    typeof order.user === "string" ? "Unknown" : order.user?.name || "Unknown";

const getCustomerEmail = (order: Order) =>
    typeof order.user === "string" ? "" : order.user?.email || "";

const getItemLabel = (item: Order["items"][number]) =>
    typeof item.product === "string" ? item.name : item.product?.name || item.name;

export default function AdminOrders() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<typeof FILTER_STATUSES[number]>("all");

    // Modal State
    const [statusModalVisible, setStatusModalVisible] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [updating, setUpdating] = useState(false);

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesSearch = searchQuery === "" || 
                getCustomerName(order).toLowerCase().includes(searchQuery.toLowerCase()) ||
                order._id.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter = activeFilter === "all" || order.orderStatus === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [orders, searchQuery, activeFilter]);

    // Stats
    const orderStats = useMemo(() => {
        return {
            all: orders.length,
            placed: orders.filter(o => o.orderStatus === "placed").length,
            processing: orders.filter(o => o.orderStatus === "processing").length,
            shipped: orders.filter(o => o.orderStatus === "shipped").length,
            delivered: orders.filter(o => o.orderStatus === "delivered").length,
            cancelled: orders.filter(o => o.orderStatus === "cancelled").length,
        };
    }, [orders]);

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
        if (token) fetchOrders();
    }, [token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const openDetailModal = (order: Order) => {
        setSelectedOrder(order);
        setDetailModalVisible(true);
    };

    const openStatusModal = (order: Order) => {
        if (isOrderLocked(order)) {
            Toast.show({
                type: "info",
                text1: "Cannot update",
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

            setOrders((current) =>
                current.map((order) => order._id === selectedOrder._id ? data.order : order)
            );
            setSelectedOrder(data.order);
            setStatusModalVisible(false);
            Toast.show({
                type: "success",
                text1: "Updated",
                text2: `Order is now ${data.order.orderStatus}.`,
            });
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Failed",
                text2: error instanceof Error ? error.message : "Try again.",
            });
        } finally {
            setUpdating(false);
        }
    };

    const updateStatus = (newStatus: OrderStatus) => {
        if (!selectedOrder) return;

        if (newStatus === "cancelled") {
            Alert.alert(
                "Cancel Order",
                "Are you sure? This cannot be undone.",
                [
                    { text: "No", style: "cancel" },
                    { text: "Yes, Cancel", style: "destructive", onPress: () => performUpdateStatus(newStatus) },
                ]
            );
            return;
        }
        performUpdateStatus(newStatus);
    };

    const availableStatuses = selectedOrder ? STATUSES.filter((status) => {
        if (status === selectedOrder.orderStatus) return true;
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
            {/* Search Bar */}
            <View className="px-4 pt-4 pb-2">
                <View className="flex-row items-center bg-white rounded-xl px-4 py-3">
                    <Ionicons name="search-outline" size={20} color={COLORS.secondary} />
                    <TextInput
                        className="flex-1 ml-3 text-primary"
                        placeholder="Search orders..."
                        placeholderTextColor={COLORS.secondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery !== "" && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={20} color={COLORS.secondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Tabs */}
            <View className="px-4 py-2">
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={FILTER_STATUSES}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setActiveFilter(item)}
                            className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${
                                activeFilter === item ? 'bg-primary' : 'bg-white'
                            }`}
                        >
                            <Text className={`text-sm font-medium capitalize ${
                                activeFilter === item ? 'text-white' : 'text-secondary'
                            }`}>
                                {item}
                            </Text>
                            <View className={`ml-2 px-1.5 py-0.5 rounded-full ${
                                activeFilter === item ? 'bg-white/20' : 'bg-gray-100'
                            }`}>
                                <Text className={`text-xs font-bold ${
                                    activeFilter === item ? 'text-white' : 'text-secondary'
                                }`}>
                                    {orderStats[item as keyof typeof orderStats]}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* Orders List */}
            <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View className="items-center justify-center py-20">
                        <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
                        <Text className="text-secondary mt-3">No orders found</Text>
                    </View>
                }
                renderItem={({ item: order }) => (
                    <TouchableOpacity 
                        className="bg-white rounded-2xl mb-3 overflow-hidden"
                        onPress={() => openDetailModal(order)}
                        activeOpacity={0.8}
                    >
                        {/* Order Header */}
                        <View className="flex-row items-center justify-between p-4 border-b border-gray-50">
                            <View className="flex-row items-center flex-1">
                                <View 
                                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                    style={{ backgroundColor: STATUS_CONFIG[order.orderStatus]?.color + '15' }}
                                >
                                    <Ionicons 
                                        name={STATUS_CONFIG[order.orderStatus]?.icon || "receipt-outline"} 
                                        size={20} 
                                        color={STATUS_CONFIG[order.orderStatus]?.color || COLORS.primary} 
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-primary font-semibold" numberOfLines={1}>
                                        {getCustomerName(order)}
                                    </Text>
                                    <Text className="text-secondary text-xs">
                                        #{order._id.slice(-8).toUpperCase()}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => openStatusModal(order)}
                                className={`flex-row items-center px-3 py-1.5 rounded-full ${getStatusColor(order.orderStatus)}`}
                            >
                                <Text className="text-xs font-bold uppercase mr-1">{order.orderStatus}</Text>
                                {!isOrderLocked(order) ? (
                                    <Ionicons name="chevron-down" size={14} color="currentColor" style={{ opacity: 0.6 }} />
                                ) : (
                                    <Ionicons name="lock-closed" size={12} color="currentColor" style={{ opacity: 0.6 }} />
                                )}
                            </TouchableOpacity>
                        </View>

                        {/* Order Details */}
                        <View className="p-4">
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-secondary text-xs">
                                        {order.items.reduce((acc, item) => acc + item.quantity, 0)} items
                                    </Text>
                                    <Text className="text-secondary text-xs mt-0.5">
                                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </Text>
                                </View>
                                <Text className="text-primary font-bold text-lg">
                                    ${order.totalAmount.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {/* Order Detail Modal */}
            <Modal visible={detailModalVisible} animationType="slide" transparent>
                <TouchableWithoutFeedback onPress={() => setDetailModalVisible(false)}>
                    <View className="flex-1 justify-end bg-black/50">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-t-3xl max-h-[85%]">
                                {selectedOrder && (
                                    <>
                                        {/* Modal Header */}
                                        <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
                                            <View>
                                                <Text className="text-primary font-bold text-lg">Order Details</Text>
                                                <Text className="text-secondary text-xs">#{selectedOrder._id.slice(-8).toUpperCase()}</Text>
                                            </View>
                                            <TouchableOpacity 
                                                onPress={() => setDetailModalVisible(false)}
                                                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                            >
                                                <Ionicons name="close" size={20} color={COLORS.primary} />
                                            </TouchableOpacity>
                                        </View>

                                        <FlatList
                                            data={[1]}
                                            renderItem={() => (
                                                <View className="p-5">
                                                    {/* Customer Info */}
                                                    <View className="mb-5">
                                                        <Text className="text-xs text-secondary font-bold mb-3 uppercase tracking-wider">Customer</Text>
                                                        <View className="flex-row items-center">
                                                            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                                                                <Text className="text-primary font-bold text-lg">
                                                                    {getCustomerName(selectedOrder).charAt(0).toUpperCase()}
                                                                </Text>
                                                            </View>
                                                            <View>
                                                                <Text className="text-primary font-semibold">{getCustomerName(selectedOrder)}</Text>
                                                                <Text className="text-secondary text-sm">{getCustomerEmail(selectedOrder)}</Text>
                                                            </View>
                                                        </View>
                                                    </View>

                                                    {/* Shipping Address */}
                                                    <View className="mb-5">
                                                        <Text className="text-xs text-secondary font-bold mb-3 uppercase tracking-wider">Shipping Address</Text>
                                                        <View className="bg-gray-50 p-4 rounded-xl">
                                                            <Text className="text-primary">
                                                                {selectedOrder.shippingAddress?.thonToDanPho}, {selectedOrder.shippingAddress?.xaPhuong}
                                                            </Text>
                                                            <Text className="text-secondary text-sm mt-1">
                                                                {selectedOrder.shippingAddress?.quanHuyen && `${selectedOrder.shippingAddress.quanHuyen}, `}
                                                                {selectedOrder.shippingAddress?.tinhThanh}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {/* Items */}
                                                    <View className="mb-5">
                                                        <Text className="text-xs text-secondary font-bold mb-3 uppercase tracking-wider">Items</Text>
                                                        {selectedOrder.items.map((item, index) => (
                                                            <View 
                                                                key={`${selectedOrder._id}-${index}`} 
                                                                className={`flex-row justify-between py-3 ${
                                                                    index !== selectedOrder.items.length - 1 ? 'border-b border-gray-100' : ''
                                                                }`}
                                                            >
                                                                <View className="flex-1">
                                                                    <Text className="text-primary font-medium">{getItemLabel(item)}</Text>
                                                                    <Text className="text-secondary text-xs mt-0.5">
                                                                        Qty: {item.quantity} {item.size && `| Size: ${item.size}`}
                                                                    </Text>
                                                                </View>
                                                                <Text className="text-primary font-semibold">${(item.price * item.quantity).toFixed(2)}</Text>
                                                            </View>
                                                        ))}
                                                    </View>

                                                    {/* Total */}
                                                    <View className="bg-primary/5 p-4 rounded-xl flex-row justify-between items-center mb-5">
                                                        <Text className="text-primary font-semibold">Total</Text>
                                                        <Text className="text-primary font-bold text-xl">${selectedOrder.totalAmount.toFixed(2)}</Text>
                                                    </View>

                                                    {/* Status */}
                                                    <View className="mb-5">
                                                        <Text className="text-xs text-secondary font-bold mb-3 uppercase tracking-wider">Status</Text>
                                                        <View className="flex-row items-center justify-between">
                                                            <View className={`flex-row items-center px-4 py-2 rounded-full ${getStatusColor(selectedOrder.orderStatus)}`}>
                                                                <Ionicons 
                                                                    name={STATUS_CONFIG[selectedOrder.orderStatus]?.icon || "ellipse"} 
                                                                    size={16} 
                                                                    color={STATUS_CONFIG[selectedOrder.orderStatus]?.color}
                                                                    style={{ marginRight: 6 }}
                                                                />
                                                                <Text className="font-bold uppercase text-sm">{selectedOrder.orderStatus}</Text>
                                                            </View>
                                                            {!isOrderLocked(selectedOrder) && (
                                                                <TouchableOpacity
                                                                    onPress={() => {
                                                                        setDetailModalVisible(false);
                                                                        setTimeout(() => openStatusModal(selectedOrder), 300);
                                                                    }}
                                                                    className="bg-primary px-4 py-2 rounded-full"
                                                                >
                                                                    <Text className="text-white font-semibold text-sm">Update</Text>
                                                                </TouchableOpacity>
                                                            )}
                                                        </View>
                                                    </View>

                                                    {/* Timestamps */}
                                                    <View>
                                                        <Text className="text-xs text-secondary font-bold mb-3 uppercase tracking-wider">Timeline</Text>
                                                        <View className="flex-row items-center mb-2">
                                                            <Ionicons name="calendar-outline" size={16} color={COLORS.secondary} />
                                                            <Text className="text-secondary text-sm ml-2">
                                                                Created: {new Date(selectedOrder.createdAt).toLocaleString()}
                                                            </Text>
                                                        </View>
                                                        <View className="flex-row items-center">
                                                            <Ionicons name="refresh-outline" size={16} color={COLORS.secondary} />
                                                            <Text className="text-secondary text-sm ml-2">
                                                                Updated: {new Date(selectedOrder.updatedAt).toLocaleString()}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            )}
                                        />
                                    </>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Status Update Modal */}
            <Modal visible={statusModalVisible} animationType="fade" transparent>
                <TouchableWithoutFeedback onPress={() => setStatusModalVisible(false)}>
                    <View className="flex-1 justify-end bg-black/50">
                        <TouchableWithoutFeedback>
                            <View className="bg-white rounded-t-3xl p-5">
                                <View className="flex-row justify-between items-center mb-5">
                                    <Text className="text-primary font-bold text-lg">Update Status</Text>
                                    <TouchableOpacity 
                                        onPress={() => setStatusModalVisible(false)}
                                        className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                                    >
                                        <Ionicons name="close" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                </View>

                                {updating ? (
                                    <View className="py-10">
                                        <ActivityIndicator size="large" color={COLORS.primary} />
                                        <Text className="text-center text-secondary mt-3">Updating...</Text>
                                    </View>
                                ) : (
                                    <>
                                        {availableStatuses.map((status) => {
                                            const isActive = selectedOrder?.orderStatus === status;
                                            const config = STATUS_CONFIG[status];
                                            
                                            return (
                                                <TouchableOpacity
                                                    key={status}
                                                    onPress={() => updateStatus(status)}
                                                    className={`flex-row items-center p-4 rounded-xl mb-2 ${
                                                        isActive ? 'bg-primary/10 border-2 border-primary' : 'bg-gray-50'
                                                    }`}
                                                >
                                                    <View 
                                                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                                                        style={{ backgroundColor: config?.color + '20' }}
                                                    >
                                                        <Ionicons 
                                                            name={config?.icon || "ellipse"} 
                                                            size={20} 
                                                            color={config?.color} 
                                                        />
                                                    </View>
                                                    <Text className={`flex-1 font-medium capitalize ${
                                                        isActive ? 'text-primary font-bold' : 'text-secondary'
                                                    }`}>
                                                        {status}
                                                    </Text>
                                                    {isActive && (
                                                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                        <Text className="text-xs text-secondary mt-3 text-center">
                                            Orders progress: Placed → Processing → Shipped → Delivered
                                        </Text>
                                    </>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}
