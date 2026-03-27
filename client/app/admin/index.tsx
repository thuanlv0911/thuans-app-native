import { COLORS, getStatusColor } from "@/constants/theme";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    recentOrders: any[];
}

export default function AdminDashboard() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentOrders: []
    });

    const fetchStats = async () => {
        try {
            const data = await apiRequest<{ stats: DashboardStats }>("/admin/dashboard", {
                token,
            });
            setStats(data.stats as any);
        } catch (error) {
            console.error("Failed to fetch admin stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchStats();
        }
    }, [token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 justify-center items-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            className="flex-1 bg-surface"
            contentContainerStyle={{ paddingBottom: 32 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Header Welcome */}
            <View className="bg-primary px-5 pt-4 pb-8 rounded-b-3xl">
                <Text className="text-white/70 text-sm">Welcome back,</Text>
                <Text className="text-white text-xl font-bold mt-1">{user?.name || 'Admin'}</Text>

                {/* Quick Stats Row */}
                <View className="flex-row mt-5 -mb-14">
                    <QuickStatCard
                        icon="wallet-outline"
                        label="Revenue"
                        value={`$${stats.totalRevenue.toFixed(0)}`}
                        color="#10B981"
                    />
                    <View className="w-3" />
                    <QuickStatCard
                        icon="cart-outline"
                        label="Orders"
                        value={stats.totalOrders.toString()}
                        color="#6366F1"
                    />
                </View>
            </View>

            {/* Stats Grid */}
            <View className="px-4 mt-16">
                <View className="flex-row">
                    <StatCard
                        icon="cube-outline"
                        label="Products"
                        value={stats.totalProducts.toString()}
                        color="#F59E0B"
                        onPress={() => router.push('/admin/products')}
                    />
                    <View className="w-3" />
                    <StatCard
                        icon="people-outline"
                        label="Users"
                        value={stats.totalUsers.toString()}
                        color="#EC4899"
                    />
                </View>
            </View>

            {/* Recent Orders Section */}
            <View className="px-4 mt-6">
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-primary font-bold text-lg">Recent Orders</Text>
                    <TouchableOpacity
                        className="flex-row items-center"
                        onPress={() => router.push('/admin/orders')}
                    >
                        <Text className="text-secondary text-sm mr-1">View All</Text>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} />
                    </TouchableOpacity>
                </View>

                {stats.recentOrders.length === 0 ? (
                    <View className="bg-white p-8 rounded-2xl items-center">
                        <Ionicons name="receipt-outline" size={48} color={COLORS.border} />
                        <Text className="text-secondary mt-3">No recent orders</Text>
                    </View>
                ) : (
                    <View className="bg-white rounded-2xl overflow-hidden">
                        {stats.recentOrders.map((order: any, index: number) => (
                            <OrderItem
                                key={order._id}
                                order={order}
                                isLast={index === stats.recentOrders.length - 1}
                            />
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

// Quick Stat Card - Appears in header
const QuickStatCard = ({
    icon,
    label,
    value,
    color
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color: string;
}) => (
    <View
        className="flex-1 bg-white p-4 rounded-2xl"
        style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
        }}
    >
        <View className="flex-row items-center">
            <View
                className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                style={{ backgroundColor: `${color}15` }}
            >
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View>
                <Text className="text-secondary text-xs">{label}</Text>
                <Text className="text-primary font-bold text-lg">{value}</Text>
            </View>
        </View>
    </View>
);

// Stat Card - Regular stats
const StatCard = ({
    icon,
    label,
    value,
    color,
    onPress
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    color: string;
    onPress?: () => void;
}) => (
    <TouchableOpacity
        className="flex-1 bg-white p-4 rounded-2xl"
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
    >
        <View
            className="w-10 h-10 rounded-xl items-center justify-center mb-3"
            style={{ backgroundColor: `${color}15` }}
        >
            <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text className="text-primary font-bold text-xl">{value}</Text>
        <Text className="text-secondary text-xs mt-0.5">{label}</Text>
    </TouchableOpacity>
);

// Order Item Component
const OrderItem = ({ order, isLast }: { order: any; isLast: boolean }) => {
    const itemCount = order.items.reduce((acc: number, item: any) => acc + item.quantity, 0);

    return (
        <View className={`p-4 ${!isLast ? 'border-b border-gray-50' : ''}`}>
            <View className="flex-row justify-between items-start">
                <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                        <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center mr-2">
                            <Text className="text-primary font-bold text-xs">
                                {(order.user?.name || '?').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className="flex-1">
                            <Text className="text-primary font-semibold text-sm" numberOfLines={1}>
                                {order.user?.name || 'Unknown User'}
                            </Text>
                            <Text className="text-secondary text-xs">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="items-end">
                    <Text className="text-primary font-bold">${order.totalAmount.toFixed(2)}</Text>
                    <View className={`px-2 py-0.5 rounded-full mt-1 ${getStatusColor(order.orderStatus)}`}>
                        <Text className="text-[10px] font-semibold uppercase">{order.orderStatus}</Text>
                    </View>
                </View>
            </View>

            <View className="flex-row items-center mt-2 ml-10">
                <Ionicons name="time-outline" size={12} color={COLORS.secondary} />
                <Text className="text-secondary text-xs ml-1">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </Text>
            </View>
        </View>
    );
};
