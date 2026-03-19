import { COLORS, PROFILE_MENU } from '@/constants/theme';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';


export default function Profile() {
    const { user, isLoading, isAdmin, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        Toast.show({
            type: 'success',
            text1: 'Logged out',
            position: 'top',
        });
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                <Header title="Profile" showMenu showCart />
                <ScrollView
                    className="flex-1 px-4"
                    contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                >
                    <View className="items-center w-full">
                        <View className="mb-6">
                            <Ionicons name="person" size={64} color={COLORS.secondary} />
                        </View>
                        <Text className="text-primary font-bold text-2xl mb-3">Guest</Text>
                        <Text className="text-secondary text-base mb-10 text-center w-4/5">
                            Please log in to view your personal information, orders, and address
                        </Text>

                        <TouchableOpacity
                            className="bg-primary w-4/5 py-4 rounded-full items-center shadow-md"
                            onPress={() => router.push('/sign-in')}
                        >
                            <Text className="text-white font-bold text-lg">Login / Register</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-4 border border-gray-300 w-4/5 py-4 rounded-full items-center"
                            onPress={() => router.push('/sign-up')}
                        >
                            <Text className="text-primary font-semibold text-lg">Create new account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="Profile" showMenu showCart />

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}>
                <View className="items-center mb-10">
                    <View className="mb-3">
                        <Ionicons name="person-circle" size={80} color={COLORS.primary} />
                    </View>
                    <Text className="text-2xl font-bold text-primary">
                        {user.name || 'Người dùng'}
                    </Text>
                </View>

                <View className="bg-gray-50 rounded-2xl p-5 mb-8">
                    <Text className="text-sm uppercase tracking-wider text-gray-500 mb-4">User Information</Text>
                    <Text className="text-base text-primary">Role: {user.role || 'Khách hàng'}</Text>
                    <Text className="text-secondary text-base mt-1">Email: {user.email}</Text>
                    {/* <Text className="text-base text-primary mt-2">ID: {user.id}</Text> */}
                </View>

                {isAdmin && (
                    <TouchableOpacity
                        className="mb-8 flex-row items-center justify-center rounded-2xl bg-primary p-4"
                        onPress={() => router.push('/admin')}
                    >
                        <Ionicons name="shield-checkmark-outline" size={22} color="white" />
                        <Text className="ml-3 text-lg font-bold text-white">Go to Admin</Text>
                    </TouchableOpacity>
                )}

                {/* Menu */}
                <View className="mb-6">
                    {PROFILE_MENU.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            className={`flex-row items-center p-4 ${index !== PROFILE_MENU.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View className="w-11 h-11 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
                                <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
                            </View>
                            <Text className="flex-1 text-primary font-medium text-base">{item.title}</Text>
                            <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    className="flex-row items-center justify-center p-5 bg-white rounded-2xl shadow-sm"
                    onPress={handleSignOut}
                >
                    <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                    <Text className="text-red-500 font-bold text-lg ml-3">Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
