import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useMemo } from 'react'
import { Image, Text, TouchableOpacity, View, Dimensions } from 'react-native'
import { ProductCardProps } from '../types'
import { useWishlist } from '../context/WishlistContext'
import { COLORS } from '@/constants/theme'
import { useAuth } from '../context/AuthContext'
import Toast from 'react-native-toast-message'

const { width } = Dimensions.get('window');

interface MasonryProductCardProps extends ProductCardProps {
    index?: number;
}

export default function ProductCard({ product, index = 0 }: MasonryProductCardProps) {
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const isLiked = isInWishlist(product._id);
    const isOutOfStock = product.stock <= 0 || !product.isActive;

    // Create varied heights for masonry effect based on product id
    const imageHeight = useMemo(() => {
        const hash = product._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const heights = [180, 220, 260, 200, 240];
        return heights[hash % heights.length];
    }, [product._id]);

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
            className='bg-white rounded-2xl overflow-hidden mb-3'
            style={{
                width: (width - 40) / 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
            }}
            onPress={() => router.push(`/product/${product._id}`)}
            activeOpacity={0.9}
        >
            <View className='relative w-full bg-gray-50' style={{ height: imageHeight }}>
                <Image 
                    source={{ uri: product.images?.[0] ?? '' }}
                    className='w-full h-full' 
                    resizeMode='cover' 
                />

                {/* Wishlist button */}
                <TouchableOpacity 
                    className='absolute top-3 right-3 z-10 bg-white/90 rounded-full p-2'
                    style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                    }}
                    onPress={handleWishlistPress}
                >
                    <Ionicons 
                        name={isLiked ? 'heart' : 'heart-outline'} 
                        size={18} 
                        color={isLiked ? COLORS.accent : COLORS.primary} 
                    />
                </TouchableOpacity>

                {/* Featured badge */}
                {product.isFeatured && (
                    <View className='absolute top-3 left-3 bg-primary px-2.5 py-1 rounded-full'>
                        <Text className='text-white text-[10px] font-bold uppercase tracking-wide'>Featured</Text>
                    </View>
                )}

                {/* Out of stock overlay */}
                {isOutOfStock && (
                    <View className='absolute inset-0 bg-black/40 items-center justify-center'>
                        <View className='bg-white/95 px-3 py-1.5 rounded-full'>
                            <Text className='text-primary text-xs font-bold'>Out of Stock</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Product info */}
            <View className='p-3'>
                <Text className='text-secondary text-[10px] uppercase tracking-wider mb-1'>
                    {typeof product.category === 'string' ? product.category : product.category.name}
                </Text>
                <Text className='text-primary font-semibold text-sm mb-2' numberOfLines={2}>
                    {product.name}
                </Text>
                <View className='flex-row items-center justify-between'>
                    <Text className='text-primary font-bold text-base'>${product.price.toFixed(2)}</Text>
                    {product.stock > 0 && product.stock <= 5 && (
                        <Text className='text-orange-500 text-[10px] font-medium'>Only {product.stock} left</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    )
}
