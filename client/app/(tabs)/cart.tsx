import { COLORS } from '@/constants/theme';
import AuthRequiredState from '@/src/components/AuthRequiredState';
import CartItem from '@/src/components/CartItem';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Cart() {
    const { isAuthenticated } = useAuth();
    const { 
        cartItems, 
        removeFromCart, 
        updateQuantity, 
        selectedItems, 
        toggleSelectItem, 
        selectAll, 
        clearSelection, 
        selectedTotal, 
        selectedCartItems 
    } = useCart();
    const router = useRouter();

    const shipping = 2.00;
    const total = selectedCartItems.length > 0 ? selectedTotal + shipping : 0;

    // Empty Cart View
    const EmptyCartView = () => (
        <View className='flex-1 items-center justify-center px-6'>
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
                <Ionicons name='cart-outline' size={50} color={COLORS.secondary} />
            </View>
            <Text className='text-2xl font-bold text-primary mb-2'>Your Cart is Empty</Text>
            <Text className='text-secondary text-center text-base mb-8'>
                Looks like you haven&apos;t added anything to your cart yet.
            </Text>
            <TouchableOpacity 
                className='bg-primary px-8 py-4 rounded-2xl flex-row items-center'
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 4,
                }}
                onPress={() => router.push('/')}
            >
                <Ionicons name='bag-outline' size={20} color='#FFF' />
                <Text className='text-white font-bold text-base ml-2'>Start Shopping</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
            <Header title='My Cart' showMenu showCart />
            
            {!isAuthenticated ? (
                <AuthRequiredState
                    title="Sign in to view your cart"
                    description="Please sign in to add items to your cart and proceed to checkout."
                />
            ) : cartItems.length === 0 ? (
                <EmptyCartView />
            ) : (
                <>
                    {/* Selection Header */}
                    <View className='px-4 py-3 flex-row justify-between items-center bg-white mx-4 mt-2 rounded-2xl'>
                        <View className='flex-row items-center'>
                            <TouchableOpacity 
                                onPress={selectedItems.size === cartItems.length ? clearSelection : selectAll}
                                className='flex-row items-center'
                            >
                                <Ionicons 
                                    name={selectedItems.size === cartItems.length ? 'checkbox' : 'square-outline'} 
                                    size={22} 
                                    color={COLORS.primary} 
                                />
                                <Text className='text-primary font-medium ml-2'>
                                    {selectedItems.size === cartItems.length ? 'Deselect All' : 'Select All'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        <View className='bg-primary/10 px-3 py-1 rounded-full'>
                            <Text className='text-primary font-semibold text-sm'>
                                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                            </Text>
                        </View>
                    </View>

                    {/* Cart Items */}
                    <ScrollView 
                        className='flex-1 px-4 mt-4'
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    >
                        {cartItems.map((item, index) => (
                            <CartItem 
                                key={item.id}
                                item={item}
                                isSelected={selectedItems.has(item.id)}
                                onToggleSelect={() => toggleSelectItem(item.id)}
                                onRemove={() => removeFromCart(item.productId, item.size)}
                                onUpdateQuantity={(q) => updateQuantity(item.productId, q, item.size)}
                            />
                        ))}
                    </ScrollView>

                    {/* Checkout Footer */}
                    <View 
                        className='bg-white rounded-t-3xl px-6 pt-5 pb-8'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.06,
                            shadowRadius: 16,
                            elevation: 10,
                        }}
                    >
                        {/* Order Summary */}
                        <View className='mb-4'>
                            <TouchableOpacity className='flex-row items-center justify-between mb-3'>
                                <Text className='text-secondary text-sm'>Order Summary</Text>
                                <Ionicons name='chevron-down' size={16} color={COLORS.secondary} />
                            </TouchableOpacity>
                            
                            <View className='flex-row justify-between mb-2'>
                                <Text className='text-secondary'>Subtotal ({selectedCartItems.length} items)</Text>
                                <Text className='text-primary font-semibold'>${selectedTotal.toFixed(2)}</Text>
                            </View>

                            <View className='flex-row justify-between mb-3'>
                                <Text className='text-secondary'>Shipping</Text>
                                <Text className='text-primary font-semibold'>
                                    {selectedCartItems.length > 0 ? `$${shipping.toFixed(2)}` : 'Free'}
                                </Text>
                            </View>

                            <View className='h-px bg-gray-100 mb-3' />

                            <View className='flex-row justify-between'>
                                <Text className='text-primary font-bold text-lg'>Total</Text>
                                <Text className='text-primary font-bold text-xl'>${total.toFixed(2)}</Text>
                            </View>
                        </View>

                        {/* Checkout Button */}
                        <TouchableOpacity 
                            className={`py-4 rounded-2xl items-center flex-row justify-center ${
                                selectedCartItems.length > 0 ? 'bg-primary' : 'bg-gray-200'
                            }`}
                            style={selectedCartItems.length > 0 ? {
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 12,
                                elevation: 4,
                            } : {}}
                            disabled={selectedCartItems.length === 0}
                            onPress={() => router.push('/checkout')}
                        >
                            <Ionicons 
                                name='card-outline' 
                                size={20} 
                                color={selectedCartItems.length > 0 ? '#FFF' : COLORS.secondary} 
                            />
                            <Text className={`font-bold text-base ml-2 ${
                                selectedCartItems.length > 0 ? 'text-white' : 'text-secondary'
                            }`}>
                                Proceed to Checkout
                            </Text>
                        </TouchableOpacity>

                        {/* Secure Badge */}
                        <View className='flex-row items-center justify-center mt-4'>
                            <Ionicons name='shield-checkmark-outline' size={14} color={COLORS.secondary} />
                            <Text className='text-secondary text-xs ml-1'>Secure checkout with SSL encryption</Text>
                        </View>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}
