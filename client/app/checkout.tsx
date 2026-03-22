import { COLORS } from '@/constants/theme';
import AuthRequiredState from '@/src/components/AuthRequiredState';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { apiRequest } from '@/src/services/api';
import { Address } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function Checkout() {
    const params = useLocalSearchParams<{ selectedAddressId?: string }>();
    const { isAuthenticated, token } = useAuth();
    const { selectedCartItems, selectedTotal, refreshCart } = useCart();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "stripe">('cash');

    const shipping = 2.0;
    const tax = 0;
    const total = selectedTotal + shipping + tax;

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
            const addressList = data.addresses ?? [];
            const requestedAddressId = typeof params.selectedAddressId === 'string' ? params.selectedAddressId : null;
            const requestedAddress = requestedAddressId
                ? addressList.find((address) => address._id === requestedAddressId)
                : null;
            const defaultAddress = addressList.find((address) => address.isDefault) || addressList[0] || null;

            setAddresses(addressList);
            setSelectedAddressId(requestedAddress?._id || defaultAddress?._id || null);
        } catch (error) {
            console.warn('fetchAddresses:', error);
            setAddresses([]);
            setSelectedAddressId(null);
        } finally {
            setPageLoading(false);
        }
    }, [params.selectedAddressId, token]);

    const handlePlaceOrder = async () => {
        if (selectedCartItems.length === 0) {
            Toast.show({
                type: 'error',
                text1: 'No items selected',
                text2: 'Please select items to checkout.',
            });
            return;
        }

        if (!selectedAddressId) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please select a shipping address',
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
                    selectedItemIds: selectedCartItems.map((item) => item.id),
                },
            });

            await refreshCart();

            Toast.show({
                type: 'success',
                text1: 'Order placed',
                text2: 'Your selected products are placed successfully.',
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
                    title="Login to proceed to checkout"
                    description="Please log in to continue with your purchase, select a shipping address, and complete the payment."
                />
            ) : selectedCartItems.length === 0 ? (
                <View className='flex-1 items-center justify-center'>
                    <Text className='text-secondary text-lg'>No items selected for checkout</Text>
                    <TouchableOpacity onPress={() => router.back()} className='mt-4'>
                        <Text className='text-primary font-bold'>Back to Cart</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <ScrollView className='flex-1 px-4 mt-4'>
                        <View className='flex-row items-center justify-between mb-4'>
                            <Text className='text-lg font-bold text-primary'>Shipping Address</Text>
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: '/addresses',
                                    params: {
                                        select: 'true',
                                        selectedAddressId: selectedAddressId || '',
                                    },
                                })}
                            >
                                <Text className='text-accent text-sm font-medium'>
                                    {selectedAddress ? 'Change' : 'Add Address'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {selectedAddress ? (
                            <View className='bg-white p-4 rounded-xl mb-6 shadow-sm border border-gray-100'>
                                <View className='flex-row items-center justify-between mb-2'>
                                    <View className='flex-row items-center'>
                                        <Ionicons name='location-outline' size={20} color={COLORS.primary} />
                                        <Text className='text-base font-bold text-primary ml-2'>{selectedAddress.type}</Text>
                                        {selectedAddress.isDefault && (
                                            <View className='bg-primary/10 px-2 py-1 rounded ml-2'>
                                                <Text className='text-primary text-xs font-bold'>Default</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <Text className='text-secondary leading-5 ml-7'>
                                    {selectedAddress.thonToDanPho}, {selectedAddress.xaPhuong}
                                    {selectedAddress.quanHuyen ? `, ${selectedAddress.quanHuyen}` : ''}
                                    {`, ${selectedAddress.tinhThanh}`}
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: '/addresses',
                                    params: { select: 'true' },
                                })}
                                className='bg-white p-6 rounded-xl mb-6 items-center justify-center border-dashed border-2 border-gray-100'
                            >
                                <Text className='text-primary font-bold'>Add Address</Text>
                            </TouchableOpacity>
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
                            <Text className='text-secondary'>Subtotal ({selectedCartItems.length} items)</Text>
                            <Text className='font-bold'>${selectedTotal.toFixed(2)}</Text>
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
