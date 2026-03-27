import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { memo } from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { ProductCardProps } from '../types'
import { useWishlist } from '../context/WishlistContext'
import { COLORS } from '@/constants/theme'
import { useAuth } from '../context/AuthContext'
import Toast from 'react-native-toast-message'

function ProductCard({ product }: ProductCardProps) {
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const isLiked = isInWishlist(product._id);
    const isOutOfStock = product.stock <= 0 || !product.isActive;

    const handleWishlistPress = async (e: any) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            Toast.show({
                type: 'info',
                text1: 'Login required',
                text2: 'Login to view your wishlist.',
            });
            router.push('/sign-in');
            return;
        }

        await toggleWishlist(product);
    };

    return (
        <TouchableOpacity 
            className='bg-white rounded-xl overflow-hidden mb-2.5'
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 2,
            }}
            onPress={() => router.push(`/product/${product._id}`)}
            activeOpacity={0.95}
        >
            <View className='relative w-full h-44'>
                <Image 
                    source={{ uri: product.images?.[0] ?? '' }}
                    className='w-full h-full bg-gray-100' 
                    resizeMode='cover' 
                />

                {/* Wishlist button */}
                <TouchableOpacity 
                    className='absolute top-2 right-2 bg-white rounded-full p-1.5'
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.15,
                        shadowRadius: 2,
                        elevation: 2,
                    }}
                    onPress={handleWishlistPress}
                >
                    <Ionicons 
                        name={isLiked ? 'heart' : 'heart-outline'} 
                        size={16} 
                        color={isLiked ? COLORS.accent : COLORS.secondary} 
                    />
                </TouchableOpacity>

                {/* Featured badge */}
                {product.isFeatured && (
                    <View className='absolute top-2 left-2 bg-primary/90 px-2 py-0.5 rounded'>
                        <Text className='text-white text-[9px] font-bold uppercase'>Hot</Text>
                    </View>
                )}

                {/* Out of stock overlay */}
                {isOutOfStock && (
                    <View className='absolute inset-0 bg-black/50 items-center justify-center'>
                        <Text className='text-white text-xs font-semibold bg-white/20 px-3 py-1 rounded-full'>Sold Out</Text>
                    </View>
                )}
            </View>

            {/* Product info */}
            <View className='p-2.5'>
                <Text className='text-primary font-medium text-xs mb-1' numberOfLines={2}>
                    {product.name}
                </Text>
                <View className='flex-row items-center justify-between'>
                    <Text className='text-primary font-bold text-sm'>${product.price.toFixed(2)}</Text>
                    {product.stock > 0 && product.stock <= 5 && (
                        <View className='bg-orange-50 px-1.5 py-0.5 rounded'>
                            <Text className='text-orange-600 text-[9px] font-medium'>{product.stock} left</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    )
}

export default memo(ProductCard);
