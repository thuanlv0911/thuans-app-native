import { COLORS } from '@/constants/theme';
import AuthRequiredState from '@/src/components/AuthRequiredState';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { apiRequest } from '@/src/services/api';
import { Address } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function Checkout() {
    const { isAuthenticated, token } = useAuth();
    const { cartItems, cartTotal, clearCart } = useCart();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "stripe">('cash');

    const shipping = 2.0;
    const tax = 0;
    const total = cartTotal + shipping + tax;

    const selectedAddress = useMemo(
        () => addresses.find((address) => address._id === selectedAddressId) || null,
        [addresses, selectedAddressId]
    );

    const fetchAddresses = useCallback(async () => {
        try {
            if (!token) {
                setAddresses([]);
                setSelectedAddressId(null);
                return;
            }

            const data = await apiRequest<{ addresses: Address[] }>('/addresses', { token });
            const addressList: Address[] = data.addresses ?? [];
            setAddresses(addressList);
            setSelectedAddressId((currentValue) => {
                if (currentValue && addressList.some((address) => address._id === currentValue)) {
                    return currentValue;
                }

                const defaultAddress = addressList.find((address) => address.isDefault) || addressList[0];
                return defaultAddress?._id ?? null;
            });
        } catch (error) {
            console.warn('fetchAddresses:', error);
            setAddresses([]);
            setSelectedAddressId(null);
        } finally {
            setPageLoading(false);
        }
    }, [token]);

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'Cart is empty',
                text2: 'Please add products before checkout.',
            });
            return;
        }

        if (!selectedAddressId) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please select a shipping address",
            });
            return;
        }

        setLoading(true);
        try {
            const data = await apiRequest<{ order: { _id: string } }>('/orders', {
                method: 'POST',
                token,
                body: {
                    addressId: selectedAddressId,
                    paymentMethod,
                },
            });

            await clearCart();
            Toast.show({
                type: 'success',
                text1: 'Order placed',
                text2: 'Your order has been created successfully.',
            });
            router.replace(`/orders/${data.order._id}`);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Place order failed',
                text2: error instanceof Error ? error.message : 'Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (!isAuthenticated) {
                setPageLoading(false);
                return;
            }

            setPageLoading(true);
            fetchAddresses();
        }, [fetchAddresses, isAuthenticated])
    );

    if (pageLoading) {
        return (
            <SafeAreaView className='flex-1 bg-surface justify-center items-center'>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
            <Header title="Checkout" showBack />
            {!isAuthenticated ? (
                <AuthRequiredState
                    title="Checkout can dang nhap"
                    description="Dang nhap de tiep tuc dat hang, chon dia chi giao hang va thanh toan."
                />
            ) : (
                <>
                    <ScrollView className='flex-1 px-4 mt-4'>
                        <View className='flex-row items-center justify-between mb-4'>
                            <Text className='text-lg font-bold text-primary'>Shipping Address</Text>
                            <TouchableOpacity onPress={() => router.push('/addresses')}>
                                <Text className='text-accent text-sm font-medium'>
                                    {addresses.length > 0 ? 'Manage' : 'Add Address'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {addresses.length > 0 ? (
                            <View className='mb-6'>
                                {addresses.map((address) => {
                                    const isSelected = selectedAddressId === address._id;

                                    return (
                                        <TouchableOpacity
                                            key={address._id}
                                            className={`bg-white p-4 rounded-xl mb-3 shadow-sm border ${isSelected ? 'border-primary' : 'border-gray-100'}`}
                                            onPress={() => setSelectedAddressId(address._id)}
                                        >
                                            <View className='flex-row items-start justify-between mb-2'>
                                                <View className='flex-row items-center flex-1 pr-3'>
                                                    <Ionicons
                                                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                                        size={20}
                                                        color={isSelected ? COLORS.primary : COLORS.secondary}
                                                    />
                                                    <Text className='text-base font-bold text-primary ml-2'>{address.type}</Text>
                                                    {address.isDefault && (
                                                        <View className='bg-primary/10 px-2 py-1 rounded ml-2'>
                                                            <Text className='text-primary text-xs font-bold'>Default</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                {isSelected && (
                                                    <Text className='text-primary text-xs font-bold uppercase'>Selected</Text>
                                                )}
                                            </View>
                                            <Text className='text-secondary leading-5 ml-7'>
                                                {address.thonToDanPho}, {address.xaPhuong}
                                                {address.quanHuyen ? `, ${address.quanHuyen}` : ''}
                                                {`, ${address.tinhThanh}`}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => router.push('/addresses')}
                                className='bg-white p-6 rounded-xl mb-6 items-center justify-center border-dashed border-2 border-gray-100'
                            >
                                <Text className='text-primary font-bold'>Add Address</Text>
                            </TouchableOpacity>
                        )}

                        {selectedAddress && (
                            <View className='bg-primary/5 rounded-xl p-4 mb-6'>
                                <Text className='text-primary font-bold mb-1'>Deliver to</Text>
                                <Text className='text-secondary leading-5'>
                                    {selectedAddress.thonToDanPho}, {selectedAddress.xaPhuong}
                                    {selectedAddress.quanHuyen ? `, ${selectedAddress.quanHuyen}` : ''}
                                    {`, ${selectedAddress.tinhThanh}`}
                                </Text>
                            </View>
                        )}

                        <Text className='text-primary text-lg font-bold mb-4'>Payment Method</Text>

                        <TouchableOpacity
                            className={`bg-white p-4 rounded-xl mb-4 shadow-sm flex-row items-center border-2 ${paymentMethod === 'cash' ? 'border-primary' : 'border-transparent'}`}
                            onPress={() => setPaymentMethod('cash')}
                        >
                            <Ionicons name='cash-outline' size={24} color={COLORS.primary} />
                            <View className='ml-3 flex-1'>
                                <Text className='text-base font-bold text-primary'>Cash on Delivery</Text>
                                <Text className='text-secondary text-xs mt-1'>Pay when you receive the order</Text>
                            </View>
                            {paymentMethod === 'cash' && <Ionicons name='checkmark-circle' size={24} color={COLORS.primary} />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className={`bg-white p-4 rounded-xl mb-4 shadow-sm flex-row items-center border-2 ${paymentMethod === 'stripe' ? 'border-primary' : 'border-transparent'}`}
                            onPress={() => setPaymentMethod('stripe')}
                        >
                            <Ionicons name='card-outline' size={24} color={COLORS.primary} />
                            <View className='ml-3 flex-1'>
                                <Text className='text-base font-bold text-primary'>Pay with Card</Text>
                                <Text className='text-secondary text-xs mt-1'>Project demo flow, confirm payment after delivery</Text>
                            </View>
                            {paymentMethod === 'stripe' && <Ionicons name='checkmark-circle' size={24} color={COLORS.primary} />}
                        </TouchableOpacity>
                    </ScrollView>

                    <View className='p-4 bg-white shadow-lg border-t border-gray-100'>
                        <Text className='text-lg font-bold text-primary mb-4'>Order Summary</Text>

                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-secondary'>Subtotal</Text>
                            <Text className='font-bold'>${cartTotal.toFixed(2)}</Text>
                        </View>

                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-secondary'>Shipping</Text>
                            <Text className='font-bold'>${shipping.toFixed(2)}</Text>
                        </View>

                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-secondary'>Tax</Text>
                            <Text className='font-bold'>${tax.toFixed(2)}</Text>
                        </View>

                        <View className='flex-row justify-between mb-4'>
                            <Text className='text-primary text-xl font-bold'>Total</Text>
                            <Text className='font-bold'>${total.toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity
                            className={`p-4 rounded-xl items-center ${loading ? 'bg-gray-400' : 'bg-primary'}`}
                            onPress={handlePlaceOrder}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color='white' />
                            ) : (
                                <Text className='text-white font-bold text-lg'>Place Order</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}
