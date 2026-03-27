import React, { useMemo, useCallback } from 'react';
import { View } from 'react-native';
import ProductCard from './ProductCard';
import { Product } from '../types';

interface MasonryListProps {
    products: Product[];
    numColumns?: number;
}

export default function MasonryList({ products, numColumns = 2 }: MasonryListProps) {
    // Optimized column distribution - balance heights better
    const columns = useMemo(() => {
        const cols: Product[][] = Array.from({ length: numColumns }, () => []);
        const heights: number[] = Array(numColumns).fill(0);

        products.forEach((product) => {
            // Estimate height based on product id hash
            const hash = product._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const estimatedHeight = [180, 210, 240, 195, 225][hash % 5];
            
            // Find column with minimum height
            const shortestColumn = heights.indexOf(Math.min(...heights));
            cols[shortestColumn].push(product);
            heights[shortestColumn] += estimatedHeight + 80; // Add padding for info section
        });

        return cols;
    }, [products, numColumns]);

    const renderColumn = useCallback((columnProducts: Product[], columnIndex: number) => (
        <View key={columnIndex} style={{ flex: 1 }}>
            {columnProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
            ))}
        </View>
    ), []);

    if (products.length === 0) return null;

    return (
        <View className='flex-row' style={{ gap: 10 }}>
            {columns.map((col, index) => renderColumn(col, index))}
        </View>
    );
}
