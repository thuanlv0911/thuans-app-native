import React from 'react';
import { View, Dimensions } from 'react-native';
import ProductCard from './ProductCard';
import { Product } from '../types';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 8;
const PADDING = 16;
const COLUMN_WIDTH = (width - PADDING * 2 - COLUMN_GAP) / 2;

interface MasonryListProps {
    products: Product[];
}

export default function MasonryList({ products }: MasonryListProps) {
    // Split products into two columns for masonry effect
    const leftColumn: Product[] = [];
    const rightColumn: Product[] = [];

    products.forEach((product, index) => {
        if (index % 2 === 0) {
            leftColumn.push(product);
        } else {
            rightColumn.push(product);
        }
    });

    return (
        <View className='flex-row' style={{ gap: COLUMN_GAP }}>
            {/* Left Column */}
            <View style={{ flex: 1 }}>
                {leftColumn.map((product, index) => (
                    <ProductCard key={product._id} product={product} index={index * 2} />
                ))}
            </View>

            {/* Right Column */}
            <View style={{ flex: 1 }}>
                {rightColumn.map((product, index) => (
                    <ProductCard key={product._id} product={product} index={index * 2 + 1} />
                ))}
            </View>
        </View>
    );
}
