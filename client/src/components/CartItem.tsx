import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { CartItemProps } from '../types';
import { COLORS } from '@/constants/theme';

export default function CartItem({ item, onRemove, onUpdateQuantity, isSelected, onToggleSelect }: CartItemProps) {
    const imageUrl = item.product.images[0];
    
    return (
        <View 
            className={`flex-row mb-3 bg-white p-4 rounded-2xl ${isSelected ? 'border-2 border-primary' : 'border border-transparent'}`}
            style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2,
            }}
        >
            {/* Selection Checkbox */}
            <TouchableOpacity 
                onPress={onToggleSelect} 
                className='mr-3 justify-center'
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <View className={`w-6 h-6 rounded-lg items-center justify-center ${isSelected ? 'bg-primary' : 'bg-gray-100'}`}>
                    {isSelected && <Ionicons name='checkmark' size={16} color='#FFF' />}
                </View>
            </TouchableOpacity>

            {/* Product Image */}
            <View className='w-24 h-24 bg-gray-50 rounded-xl overflow-hidden mr-4'>
                <Image 
                    source={{ uri: imageUrl }} 
                    className='w-full h-full' 
                    resizeMode='cover' 
                />
            </View>

            {/* Product Details */}
            <View className='flex-1 justify-between py-0.5'>
                <View>
                    <View className='flex-row justify-between items-start'>
                        <View className='flex-1 mr-2'>
                            <Text className='text-primary font-semibold text-base' numberOfLines={2}>
                                {item.product.name}
                            </Text>
                        </View>
                        <TouchableOpacity 
                            onPress={onRemove}
                            className='w-8 h-8 bg-red-50 rounded-full items-center justify-center'
                        >
                            <Ionicons name='trash-outline' size={16} color='#EF4444' />
                        </TouchableOpacity>
                    </View>
                    <View className='flex-row items-center mt-1'>
                        <View className='bg-gray-100 px-2 py-0.5 rounded'>
                            <Text className='text-secondary text-xs font-medium'>Size: {item.size}</Text>
                        </View>
                    </View>
                </View>

                {/* Price and Quantity */}
                <View className='flex-row justify-between items-center mt-2'>
                    <Text className='text-primary font-bold text-lg'>${item.product.price.toFixed(2)}</Text>
                    
                    <View className='flex-row items-center bg-gray-50 rounded-xl'>
                        <TouchableOpacity 
                            className='w-9 h-9 items-center justify-center'
                            onPress={() => onUpdateQuantity && onUpdateQuantity(item.quantity - 1)}
                        >
                            <Ionicons name='remove' size={18} color={item.quantity <= 1 ? COLORS.secondary : COLORS.primary} />
                        </TouchableOpacity>
                        <View className='w-9 items-center'>
                            <Text className='text-primary font-bold text-base'>{item.quantity}</Text>
                        </View>
                        <TouchableOpacity 
                            className='w-9 h-9 items-center justify-center'
                            onPress={() => onUpdateQuantity && onUpdateQuantity(item.quantity + 1)}
                        >
                            <Ionicons name='add' size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}
