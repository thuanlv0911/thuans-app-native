import { COLORS, PROFILE_MENU } from '@/constants/theme';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function Profile() {
    const { user, isLoading, signOut, updateName } = useAuth();
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState(user?.name || '');
    const router = useRouter();

    useEffect(() => {
        setNameInput(user?.name || '');
    }, [user?.name]);

    const handleSignOut = async () => {
        await signOut();
        Toast.show({
            type: 'success',
            text1: 'Logged out successfully',
            position: 'top',
        });
    };

    const handleSaveName = async () => {
        const trimmedName = nameInput.trim();
        if (!trimmedName) {
            Toast.show({ type: 'error', text1: 'Name cannot be empty' });
            return;
        }

        try {
            await updateName(trimmedName);
            setIsEditingName(false);
            Toast.show({ type: 'success', text1: 'Name updated successfully' });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Unable to update name',
                text2: error instanceof Error ? error.message : 'Please try again.',
            });
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    // Guest View
    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                <Header title="Profile" showMenu showCart />
                <View className='flex-1 px-6 justify-center'>
                    {/* Illustration */}
                    <View className='items-center mb-8'>
                        <View 
                            className='w-28 h-28 bg-white rounded-full items-center justify-center mb-6'
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.08,
                                shadowRadius: 16,
                                elevation: 4,
                            }}
                        >
                            <Ionicons name="person-outline" size={50} color={COLORS.secondary} />
                        </View>
                        <Text className="text-2xl font-bold text-primary mb-2">Welcome Guest</Text>
                        <Text className="text-secondary text-center text-base leading-6 px-4">
                            Sign in to access your orders, wishlist, and personalized recommendations
                        </Text>
                    </View>

                    {/* Actions */}
                    <View className='gap-3'>
                        <TouchableOpacity
                            className="bg-primary py-4 rounded-2xl items-center flex-row justify-center"
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 12,
                                elevation: 4,
                            }}
                            onPress={() => router.push('/sign-in')}
                        >
                            <Ionicons name="log-in-outline" size={20} color="#FFF" />
                            <Text className="text-white font-bold text-base ml-2">Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-white py-4 rounded-2xl items-center flex-row justify-center border border-gray-100"
                            onPress={() => router.push('/sign-up')}
                        >
                            <Ionicons name="person-add-outline" size={20} color={COLORS.primary} />
                            <Text className="text-primary font-semibold text-base ml-2">Create Account</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Features */}
                    <View className='mt-10'>
                        <Text className='text-secondary text-sm text-center mb-4'>Why create an account?</Text>
                        <View className='flex-row justify-center gap-6'>
                            {[
                                { icon: 'heart-outline', label: 'Wishlist' },
                                { icon: 'receipt-outline', label: 'Orders' },
                                { icon: 'gift-outline', label: 'Rewards' },
                            ].map((item, index) => (
                                <View key={index} className='items-center'>
                                    <View className='w-12 h-12 bg-white rounded-xl items-center justify-center mb-2'>
                                        <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
                                    </View>
                                    <Text className='text-secondary text-xs'>{item.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // Logged In View
    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="Profile" showMenu showCart />

            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Profile Header */}
                <View className='bg-primary mx-4 mt-4 rounded-3xl p-6'>
                    <View className='flex-row items-center'>
                        <View 
                            className='w-20 h-20 bg-white rounded-2xl items-center justify-center mr-4'
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                            }}
                        >
                            <Text className='text-primary text-3xl font-bold'>
                                {(user.name || 'U').charAt(0).toUpperCase()}
                            </Text>
                        </View>
                        <View className='flex-1'>
                            {isEditingName ? (
                                <View>
                                    <TextInput
                                        value={nameInput}
                                        onChangeText={setNameInput}
                                        className="bg-white/20 rounded-xl px-4 py-2.5 text-white"
                                        placeholderTextColor="rgba(255,255,255,0.6)"
                                        placeholder="Enter your name"
                                        autoFocus
                                    />
                                    <View className='flex-row mt-2 gap-2'>
                                        <TouchableOpacity 
                                            onPress={handleSaveName} 
                                            className='bg-white px-4 py-1.5 rounded-full'
                                        >
                                            <Text className='text-primary font-semibold text-sm'>Save</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            onPress={() => { setIsEditingName(false); setNameInput(user.name || ''); }} 
                                            className='bg-white/20 px-4 py-1.5 rounded-full'
                                        >
                                            <Text className='text-white font-semibold text-sm'>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <>
                                    <View className='flex-row items-center'>
                                        <Text className='text-white text-xl font-bold mr-2'>
                                            {user.name || 'User'}
                                        </Text>
                                        <TouchableOpacity 
                                            onPress={() => setIsEditingName(true)}
                                            className='bg-white/20 p-1.5 rounded-full'
                                        >
                                            <Ionicons name='pencil' size={14} color='#FFF' />
                                        </TouchableOpacity>
                                    </View>
                                    <Text className='text-white/70 text-sm mt-1'>{user.email}</Text>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Quick Stats */}
                <View className='flex-row mx-4 mt-4 gap-3'>
                    <TouchableOpacity 
                        className='flex-1 bg-white rounded-2xl p-4 items-center'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 2,
                        }}
                        onPress={() => router.push('/orders')}
                    >
                        <View className='w-10 h-10 bg-blue-50 rounded-xl items-center justify-center mb-2'>
                            <Ionicons name='receipt-outline' size={20} color='#3B82F6' />
                        </View>
                        <Text className='text-primary font-semibold'>Orders</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className='flex-1 bg-white rounded-2xl p-4 items-center'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 2,
                        }}
                        onPress={() => router.push('/addresses')}
                    >
                        <View className='w-10 h-10 bg-green-50 rounded-xl items-center justify-center mb-2'>
                            <Ionicons name='location-outline' size={20} color='#22C55E' />
                        </View>
                        <Text className='text-primary font-semibold'>Addresses</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className='flex-1 bg-white rounded-2xl p-4 items-center'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 2,
                        }}
                        onPress={() => router.push('/(tabs)/favorites')}
                    >
                        <View className='w-10 h-10 bg-red-50 rounded-xl items-center justify-center mb-2'>
                            <Ionicons name='heart-outline' size={20} color='#EF4444' />
                        </View>
                        <Text className='text-primary font-semibold'>Wishlist</Text>
                    </TouchableOpacity>
                </View>

                {/* Menu Items */}
                <View className='mx-4 mt-6'>
                    <Text className='text-secondary text-sm font-medium mb-3 px-1'>Account Settings</Text>
                    <View 
                        className='bg-white rounded-2xl overflow-hidden'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 2,
                        }}
                    >
                        {PROFILE_MENU.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                className={`flex-row items-center p-4 ${
                                    index !== PROFILE_MENU.length - 1 ? 'border-b border-gray-50' : ''
                                }`}
                                onPress={() => router.push(item.route as any)}
                            >
                                <View className='w-10 h-10 bg-gray-50 rounded-xl items-center justify-center mr-3'>
                                    <Ionicons name={item.icon as any} size={20} color={COLORS.primary} />
                                </View>
                                <Text className='flex-1 text-primary font-medium text-base'>{item.title}</Text>
                                <Ionicons name='chevron-forward' size={20} color={COLORS.secondary} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Logout */}
                <View className='mx-4 mt-6'>
                    <TouchableOpacity
                        className='flex-row items-center justify-center p-4 bg-red-50 rounded-2xl'
                        onPress={handleSignOut}
                    >
                        <Ionicons name='log-out-outline' size={22} color='#EF4444' />
                        <Text className='text-red-500 font-bold text-base ml-2'>Sign Out</Text>
                    </TouchableOpacity>
                </View>

                {/* App Version */}
                <Text className='text-secondary/50 text-xs text-center mt-8'>Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
