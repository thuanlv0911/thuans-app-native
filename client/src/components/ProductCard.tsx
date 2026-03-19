import { Ionicons } from '@expo/vector-icons'
import { Link, useRouter } from 'expo-router'
import React from 'react'
import { Image, Text, TouchableOpacity, View } from 'react-native'
import { ProductCardProps } from '../types'
import { useWishlist } from '../context/WishlistContext'
import { COLORS } from '@/constants/theme'
import { useAuth } from '../context/AuthContext'
import Toast from 'react-native-toast-message'

export default function ProductCard({ product }: ProductCardProps) {
    const { toggleWishlist, isInWishlist } = useWishlist()
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const isLiked = isInWishlist(product._id);

    const handleWishlistPress = async (e: any) => {
        e.stopPropagation();

        if (!isAuthenticated) {
            Toast.show({
                type: 'info',
                text1: 'Can dang nhap',
                text2: 'Dang nhap de them san pham vao wishlist.',
            });
            router.push('/sign-in');
            return;
        }

        await toggleWishlist(product);
    };

    return (
        <Link href={`/product/${product._id}`} asChild>
            <TouchableOpacity className='w-[48%] mb-4 bg-white rounded-lg overflow-hidden'>
                <View className='relative h-56 w-full bg-gray-100'>
                    <Image source={{ uri: product.images?.[0] ?? '' }}
                        className='w-full h-full' resizeMode='cover' />

                    <TouchableOpacity className='absolute top-2 right-2 z-10 shadow-sm bg-white rounded-full p-2' onPress={handleWishlistPress}>
                        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={20} color={isLiked ? COLORS.accent : COLORS.primary} />
                    </TouchableOpacity>

                    {/* Featured */}
                    {product.isFeatured && (
                        <View className='absolute top-2 left-2 bg-black px-2 py-1 rounded'>
                            <Text className='text-white text-xs font-bold uppercase'>Featured</Text>
                        </View>
                    )}
                </View>

                {/* Product in4 */}
                <View className='p-3'>
                    <View className='flex-row items-center'>
                        <Ionicons name='star' size={14} color='#FFD700' />
                        <Text className='text-secondary text-xs ml-1'>
                            {product.ratings.average.toFixed(1)}
                        </Text>
                    </View>
                    <Text className='text-primary font-medium text-sm mb-1' numberOfLines={1}>{product.name}</Text>
                    <View className='flex-row items-center'>
                        <Text className='text-primary font-bold text-base'>${product.price.toFixed(2)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Link>
    )
}
