import AuthRequiredState from '@/src/components/AuthRequiredState';
import Header from '@/src/components/Header';
import ProductCard from '@/src/components/ProductCard';
import { useAuth } from '@/src/context/AuthContext';
import { useWishlist } from '@/src/context/WishlistContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Favorites() {

    const { isAuthenticated } = useAuth();
    const { wishlist } = useWishlist();

    const router = useRouter();
    return (
        <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
            <Header title='Wishlist' showMenu showCart />
            {!isAuthenticated ? (
                <AuthRequiredState
                    title="Login to view your wishlist."
                    description="You must be logged in to view your wishlist. Please log in to add items to your wishlist."
                />
            ) : wishlist.length > 0 ? (
                <>
                    <ScrollView className='flex-1 px-4 mt-4'
                        showsVerticalScrollIndicator={false}>
                        <View className='flex-row flex-wrap justify-between'>
                            {wishlist.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </View>

                    </ScrollView>
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
                            className='py-4 rounded-full items-center bg-primary'
                            style={{
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 12,
                                elevation: 4,
                            }}
                            onPress={() => router.push('/shop')}
                        >
                            <Text className='text-white font-bold text-base ml-2'>Continue Shopping</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View className='flex-1 items-center justify-center'>
                    <Text className='text-secondary text-lg'>Your wishlist is emppty</Text>
                    <TouchableOpacity onPress={() => router.push('/')} className='mt-4'>
                        <Text className='text-primary font-bold'>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            )}

        </SafeAreaView>
    )
}
