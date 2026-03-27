
import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Text, TouchableOpacity, View, Dimensions } from 'react-native'
import { CategoryItemProps } from '../types'
import { COLORS } from '@/constants/theme'

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 4; // 4 columns with padding

export default function CategoryItem({ item, isSelected, onPress }: CategoryItemProps) {
    return (
        <TouchableOpacity 
            className='items-center justify-center py-3' 
            style={{ width: ITEM_WIDTH }}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View 
                className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                    isSelected 
                        ? 'bg-primary' 
                        : 'bg-white border border-gray-100'
                }`}
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isSelected ? 0.15 : 0.05,
                    shadowRadius: 8,
                    elevation: isSelected ? 4 : 2,
                }}
            >
                <Ionicons 
                    name={item.icon as any} 
                    size={28} 
                    color={isSelected ? '#FFF' : COLORS.primary} 
                />
            </View>
            <Text 
                className={`text-xs font-semibold text-center ${
                    isSelected ? 'text-primary' : 'text-secondary'
                }`}
                numberOfLines={1}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    )
}
