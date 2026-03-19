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
                    title="Wishlist can dang nhap"
                    description="Ban van co the xem san pham, nhung can dang nhap de luu wishlist cua rieng minh."
                />
            ) : wishlist.length > 0 ? (
                <ScrollView className='flex-1 px-4 mt-4'
                    showsVerticalScrollIndicator={false}>
                    <View className='flex-row flex-wrap justify-between'>
                        {wishlist.map((product) => (
                            <ProductCard key={product._id} product={product} />
                        ))}
                    </View>
                </ScrollView>
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
