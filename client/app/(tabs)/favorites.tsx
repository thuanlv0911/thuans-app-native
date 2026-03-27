import { COLORS } from '@/constants/theme';
import AuthRequiredState from '@/src/components/AuthRequiredState';
import Header from '@/src/components/Header';
import ProductCard from '@/src/components/ProductCard';
import { useAuth } from '@/src/context/AuthContext';
import { useWishlist } from '@/src/context/WishlistContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Favorites() {
    const { isAuthenticated } = useAuth();
    const { wishlist } = useWishlist();
    const router = useRouter();

    // Empty Wishlist View
    const EmptyWishlistView = () => (
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
                <Ionicons name='heart-outline' size={50} color={COLORS.secondary} />
            </View>
            <Text className='text-2xl font-bold text-primary mb-2'>Your Wishlist is Empty</Text>
            <Text className='text-secondary text-center text-base mb-8'>
                Save your favorite items here to buy them later.
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
                <Ionicons name='sparkles-outline' size={20} color='#FFF' />
                <Text className='text-white font-bold text-base ml-2'>Discover Products</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
            <Header title='Wishlist' showMenu showCart />
            
            {!isAuthenticated ? (
                <AuthRequiredState
                    title="Sign in to view your wishlist"
                    description="Please sign in to save your favorite items and access them anytime."
                />
            ) : wishlist.length === 0 ? (
                <EmptyWishlistView />
            ) : (
                <>
                    {/* Header Stats */}
                    <View className='px-4 py-3 flex-row justify-between items-center'>
                        <View className='flex-row items-center'>
                            <View className='w-8 h-8 bg-red-50 rounded-lg items-center justify-center mr-2'>
                                <Ionicons name='heart' size={16} color='#EF4444' />
                            </View>
                            <Text className='text-primary font-semibold'>
                                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
                            </Text>
                        </View>
                        <TouchableOpacity 
                            className='flex-row items-center bg-white px-3 py-2 rounded-full'
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.04,
                                shadowRadius: 4,
                                elevation: 1,
                            }}
                            onPress={() => router.push('/shop')}
                        >
                            <Ionicons name='add' size={16} color={COLORS.primary} />
                            <Text className='text-primary text-sm font-medium ml-1'>Add More</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Wishlist Items */}
                    <ScrollView 
                        className='flex-1 px-4'
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
                    >
                        <View className='flex-row flex-wrap justify-between'>
                            {wishlist.map((product) => (
                                <View key={product._id} className='w-[48%] mb-3'>
                                    <ProductCard product={product} />
                                </View>
                            ))}
                        </View>
                    </ScrollView>

                    {/* Bottom CTA */}
                    <View 
                        className='absolute bottom-0 left-0 right-0 bg-white px-4 py-4 border-t border-gray-100'
                        style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.04,
                            shadowRadius: 8,
                            elevation: 4,
                        }}
                    >
                        <TouchableOpacity 
                            className='bg-primary py-4 rounded-2xl items-center flex-row justify-center'
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 12,
                                elevation: 4,
                            }}
                            onPress={() => router.push('/shop')}
                        >
                            <Ionicons name='bag-outline' size={20} color='#FFF' />
                            <Text className='text-white font-bold text-base ml-2'>Continue Shopping</Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}
