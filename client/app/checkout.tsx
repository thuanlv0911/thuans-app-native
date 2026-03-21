import { COLORS } from '@/constants/theme';
import AuthRequiredState from '@/src/components/AuthRequiredState';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { apiRequest } from '@/src/services/api';
import { Address } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function Checkout() {
    const { isAuthenticated, token } = useAuth();
    const { cartTotal, clearCart } = useCart();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "stripe">('cash');

    const shipping = 2.0;
    const tax = 0;
    const total = cartTotal + shipping + tax;

    const fetchAddress = async () => {
        try {
            if (!token) {
                setPageLoading(false);
                return;
            }

            const data = await apiRequest<{ addresses: Address[] }>('/addresses', { token });
            const addressList: Address[] = data.addresses ?? [];
            if (addressList.length > 0) {
                const def = addressList.find((a) => a.isDefault) || addressList[0];
                setSelectedAddress(def);
            }
        } catch (error) {
            console.warn('fetchAddress:', error);
        } finally {
            setPageLoading(false);
        }
    }

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Please add a shipping address"
            })
            return;
        }

        setLoading(true);
        try {
            const data = await apiRequest<{ order: { _id: string } }>('/orders', {
                method: 'POST',
                token,
                body: {
                    addressId: selectedAddress._id,
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
    }

    useEffect(() => {
        if (!isAuthenticated) {
            setPageLoading(false);
            return;
        }

        fetchAddress();
    }, [isAuthenticated, token])

    if (pageLoading) {
        return (
            <SafeAreaView className='flex-1 bg-surface justify-center items-center'>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        )
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
                        {/* Address section */}
                        <Text className='text-lg font-bold text-primary mb-4'>Shipping Adress</Text>
                        {selectedAddress ? (
                            <View className='bg-white p-4 rounded-xl mb-6 shadow-sm'>
                                <View className='flex-row items-center justify-between mb-2'>
                                    <Text className='text-base font-bold'>{selectedAddress.type}</Text>
                                    <TouchableOpacity
                                        onPress={() => router.push('addresses')}>
                                        <Text className='text-accent text-sm'>Change</Text>
                                    </TouchableOpacity>
                                </View>
                                <Text className='text-secondary leading-5'>
                                    {selectedAddress.thonToDanPho}, {selectedAddress.xaPhuong}
                                    {selectedAddress.quanHuyen ? `, ${selectedAddress.quanHuyen}` : ''}
                                    {'\n'}
                                    {selectedAddress.tinhThanh}
                                </Text>
                            </View>


                        ) : (
                            <TouchableOpacity onPress={() => router.push('/addresses')}
                                className='bg-white p-6 rounded-xl mb-6 items-center justify-center border-dashed border-2 border-gray-100'>
                                <Text className='text-primary font-bold'>Add Address</Text>
                            </TouchableOpacity>
                        )}

                        {/* Payment section */}
                        <Text className='text-primary text-lg font-bold mb-4'>
                            Payment Method
                        </Text>

                        {/* Cash on Delivery Option */}
                        <TouchableOpacity className={`bg-white p-4 rounded-xl mb-4 shadow-sm flex-row items-center border-2 ${paymentMethod === 'cash' ? 'border-primary' : 'border-transparent'}`}
                            onPress={() => setPaymentMethod('cash')}>
                            <Ionicons name='cash-outline' size={24} color={COLORS.primary} className='mr-3' />
                            <View className='ml-3 flex-1'>
                                <Text className='text-base font-bold text-primary'>Cash on Delivery</Text>
                                <Text className='text-secondary text-xs mt-1'>Pay when you receive the order</Text>
                            </View>
                            {paymentMethod === 'cash' && <Ionicons name='checkmark-circle' size={24} color={COLORS.primary} />}
                        </TouchableOpacity>

                        {/* Stripe option */}
                        <TouchableOpacity className={`bg-white p-4 rounded-xl mb-4 shadow-sm flex-row items-center border-2 ${paymentMethod === 'stripe' ? 'border-primary' : 'border-transparent'}`}
                            onPress={() => setPaymentMethod('stripe')}>
                            <Ionicons name='cash-outline' size={24} color={COLORS.primary} className='mr-3' />
                            <View className='ml-3 flex-1'>
                                <Text className='text-base font-bold text-primary'>Pay with Card</Text>
                                <Text className='text-secondary text-xs mt-1'>Credit on Debit Card</Text>
                            </View>
                            {paymentMethod === 'stripe' && <Ionicons name='checkmark-circle' size={24} color={COLORS.primary} />}
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Order summary */}
                    <View className='p-4 bg-white shadow-lg border-t border-gray-100'>
                        <Text className='text-lg font-bold text-primary mb-4'>Order Summary</Text>

                        {/* Subtotal */}
                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-secondary'>Subtotal</Text>
                            <Text className='font-bold'>${cartTotal.toFixed(2)}</Text>
                        </View>

                        {/* Shipping */}
                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-secondary'>Shipping</Text>
                            <Text className='font-bold'>${shipping.toFixed(2)}</Text>
                        </View>

                        {/* Tax */}
                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-secondary'>Tax</Text>
                            <Text className='font-bold'>${tax.toFixed(2)}</Text>
                        </View>

                        {/* Total */}
                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-primary text-xl font-bold'>Total</Text>
                            <Text className='font-bold'>${total.toFixed(2)}</Text>
                        </View>

                        <TouchableOpacity className={`p-4 rounded-xl items-center ${loading ? 'bg-gray-400' : 'bg-primary'}`}
                            onPress={handlePlaceOrder} disabled={loading}>
                            {loading ? <ActivityIndicator color='white' /> :
                                <Text className='text-white font-bold text-lg'>Place Order</Text>
                            }
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    )
}
