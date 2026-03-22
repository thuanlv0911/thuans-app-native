
import AuthRequiredState from '@/src/components/AuthRequiredState';
import CartItem from '@/src/components/CartItem';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Cart() {

    const { isAuthenticated } = useAuth();
    const { cartItems, removeFromCart, updateQuantity, selectedItems, toggleSelectItem, selectAll, clearSelection, selectedTotal, selectedCartItems } = useCart();
    const router = useRouter();

    const shipping = 2.00;

    return (
        <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
            <Header title='My Cart' showMenu showCart />
            {!isAuthenticated ? (
                <AuthRequiredState
                    title="Login to view your shopping cart."
                    description="You must be logged in to view your shopping cart. Please log in to add items to your cart and proceed to checkout."
                />
            ) : cartItems.length > 0 ? (
                <>
                    <View className='px-4 py-2 flex-row justify-between items-center'>
                        <Text className='text-primary font-bold'>Select Items</Text>
                        <TouchableOpacity onPress={selectedItems.size === cartItems.length ? clearSelection : selectAll}>
                            <Text className='text-secondary'>{selectedItems.size === cartItems.length ? 'Deselect All' : 'Select All'}</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView className='flex-1 px-4 mt-4'
                        showsVerticalScrollIndicator={false}>
                        {cartItems.map((item) => (
                            <CartItem key={item.id}
                                item={item}
                                isSelected={selectedItems.has(item.id)}
                                onToggleSelect={() => toggleSelectItem(item.id)}
                                onRemove={() => removeFromCart(item.productId, item.size)}
                                onUpdateQuantity={(q) => updateQuantity(item.productId, q, item.size)}
                            />
                        ))}
                    </ScrollView>

                    <View className='p-4 bg-white rounded-t-3xl shadow-sm'>

                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-secondary'>Subtotal</Text>
                            <Text className='text-primary font-bold'>${selectedTotal.toFixed(2)}</Text>
                        </View>

                        <View className='flex-row justify-between mb-2'>
                            <Text className='text-secondary'>Shipping</Text>
                            <Text className='text-primary font-bold'>${selectedCartItems.length > 0 ? shipping.toFixed(2) : '0.00'}</Text>
                        </View>

                        <View className='h-[1px] bg-border mb-4' />

                        <View className='flex-row justify-between mb-6'>
                            <Text className='text-primary font-bold text-lg'>Total</Text>
                            <Text className='text-primary font-bold text-lg'>${selectedCartItems.length > 0 ? (selectedTotal + shipping).toFixed(2) : '0.00'}</Text>
                        </View>

                        <TouchableOpacity className={`py-4 rounded-full items-center ${selectedCartItems.length > 0 ? 'bg-primary' : 'bg-gray-300'}`}
                            disabled={selectedCartItems.length === 0}
                            onPress={() => router.push('/checkout')}>
                            <Text className='text-white font-bold text-base'>Checkout ({selectedCartItems.length})</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View className='flex-1 items-center justify-center'>
                    <Text className='text-secondary text-lg'>Your cart is emppty</Text>
                    <TouchableOpacity onPress={() => router.push('/')} className='mt-4'>
                        <Text className='text-primary font-bold'>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    )
}
