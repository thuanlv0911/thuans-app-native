import { COLORS } from '@/constants/theme';
import Header from '@/src/components/Header';
import MasonryList from '@/src/components/MasonryList';
import { apiRequest } from '@/src/services/api';
import { Product } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortValue = 'newest' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
    { label: 'Newest', value: 'newest' },
    { label: 'Price: Low to High', value: 'price_asc' },
    { label: 'Price: High to Low', value: 'price_desc' },
];

export default function Shop() {
    const params = useLocalSearchParams<{ category?: string }>();

    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterModalVisible, setFilterModalVisible] = useState(false);

    const [searchInput, setSearchInput] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(params.category || '');
    const [selectedSort, setSelectedSort] = useState<SortValue>('newest');
    const [minPriceInput, setMinPriceInput] = useState('');
    const [maxPriceInput, setMaxPriceInput] = useState('');

    const [draftCategory, setDraftCategory] = useState(params.category || '');
    const [draftSort, setDraftSort] = useState<SortValue>('newest');
    const [draftMinPrice, setDraftMinPrice] = useState('');
    const [draftMaxPrice, setDraftMaxPrice] = useState('');

    const fetchCategories = useCallback(async () => {
        try {
            const data = await apiRequest<{ categories: string[] }>('/products/categories');
            setCategories(data.categories || []);
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: String(page),
                limit: '10',
                sortBy: selectedSort,
            });

            if (selectedCategory) {
                query.append('category', selectedCategory);
            }

            if (searchTerm.trim()) {
                query.append('search', searchTerm.trim());
            }

            if (minPriceInput.trim()) {
                query.append('minPrice', minPriceInput.trim());
            }

            if (maxPriceInput.trim()) {
                query.append('maxPrice', maxPriceInput.trim());
            }

            const data = await apiRequest<{
                products: Product[];
                pagination: { page: number; totalPages: number };
            }>(`/products?${query.toString()}`);

            setProducts(data.products || []);
            setTotalPages(Math.max(1, data.pagination?.totalPages || 1));
        } catch (error) {
            console.error('Fetch products error:', error);
            setProducts([]);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [maxPriceInput, minPriceInput, page, searchTerm, selectedCategory, selectedSort]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        const categoryFromParams = params.category || '';
        setSelectedCategory(categoryFromParams);
        setDraftCategory(categoryFromParams);
        setPage(1);
    }, [params.category]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const activeFilters = useMemo(() => {
        const values: string[] = [];

        if (selectedCategory) {
            values.push(`Category: ${selectedCategory}`);
        }

        if (selectedSort !== 'newest') {
            values.push(SORT_OPTIONS.find((option) => option.value === selectedSort)?.label || 'Sorted');
        }

        if (minPriceInput || maxPriceInput) {
            values.push(`Price: ${minPriceInput || '0'} - ${maxPriceInput || 'Any'}`);
        }

        if (searchTerm) {
            values.push(`Search: ${searchTerm}`);
        }

        return values;
    }, [maxPriceInput, minPriceInput, searchTerm, selectedCategory, selectedSort]);

    const applySearch = () => {
        setPage(1);
        setSearchTerm(searchInput.trim());
    };

    const applyFilters = () => {
        setSelectedCategory(draftCategory);
        setSelectedSort(draftSort);
        setMinPriceInput(draftMinPrice.trim());
        setMaxPriceInput(draftMaxPrice.trim());
        setPage(1);
        setFilterModalVisible(false);
    };

    const resetFilters = () => {
        const categoryFromParams = params.category || '';

        setDraftCategory(categoryFromParams);
        setDraftSort('newest');
        setDraftMinPrice('');
        setDraftMaxPrice('');

        setSelectedCategory(categoryFromParams);
        setSelectedSort('newest');
        setMinPriceInput('');
        setMaxPriceInput('');
        setSearchInput('');
        setSearchTerm('');
        setPage(1);
        setFilterModalVisible(false);
    };

    const renderPagination = () => {
        if (totalPages <= 1) {
            return null;
        }

        const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

        return (
            <View className='px-4 pb-8'>
                <View className='flex-row items-center justify-center flex-wrap gap-2'>
                    {pageNumbers.map((pageNumber) => (
                        <TouchableOpacity
                            key={pageNumber}
                            className={`px-4 py-2 rounded-full border ${page === pageNumber ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                            onPress={() => setPage(pageNumber)}
                        >
                            <Text className={page === pageNumber ? 'text-white font-bold' : 'text-primary'}>
                                {pageNumber}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
            <Header title='Shop' showBack showCart />

            <View className='flex-row gap-2 mb-3 mx-4 my-2'>
                <View className='flex-1 flex-row items-center bg-white rounded-xl border border-gray-100'>
                    <Ionicons name='search' className='ml-4' size={20} color={COLORS.secondary} />
                    <TextInput
                        className='flex-1 ml-2 text-primary px-4 py-3'
                        placeholder='Search products...'
                        returnKeyType='search'
                        value={searchInput}
                        onChangeText={setSearchInput}
                        onSubmitEditing={applySearch}
                        placeholderTextColor={COLORS.secondary}
                    />
                    <TouchableOpacity onPress={applySearch} className='pr-4'>
                        <Text className='text-primary font-bold'>Go</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    className='bg-gray-800 w-12 h-12 items-center justify-center rounded-xl'
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Ionicons name='options-outline' size={24} color='white' />
                </TouchableOpacity>
            </View>

            {activeFilters.length > 0 ? (
                <View className='mx-4 mb-3 flex-row flex-wrap gap-2'>
                    {activeFilters.map((filterValue) => (
                        <View key={filterValue} className='bg-white border border-gray-200 px-3 py-2 rounded-full'>
                            <Text className='text-secondary text-xs'>{filterValue}</Text>
                        </View>
                    ))}
                </View>
            ) : null}

            {loading ? (
                <View className='flex-1 justify-center items-center'>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : products.length === 0 ? (
                <View className='flex-1 items-center justify-center py-20'>
                    <Ionicons name='search-outline' size={48} color={COLORS.secondary} />
                    <Text className='text-secondary mt-4'>No products found</Text>
                    <Text className='text-secondary text-sm mt-1'>Try adjusting your filters</Text>
                </View>
            ) : (
                <ScrollView 
                    className='flex-1' 
                    contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    <MasonryList products={products} />
                    {renderPagination()}
                </ScrollView>
            )}

            <Modal visible={filterModalVisible} animationType='slide' transparent>
                <TouchableWithoutFeedback onPress={() => setFilterModalVisible(false)}>
                    <View className='flex-1 justify-end bg-black/50'>
                        <View className='bg-white rounded-t-3xl p-5'>
                            <View className='flex-row items-center justify-between mb-5'>
                                <Text className='text-xl font-bold text-primary'>Filter Products</Text>
                                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                    <Ionicons name='close' size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            <Text className='text-primary font-bold mb-3'>Sort by price</Text>
                            <View className='flex-row flex-wrap gap-2 mb-5'>
                                {SORT_OPTIONS.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        className={`px-4 py-2 rounded-full border ${draftSort === option.value ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                                        onPress={() => setDraftSort(option.value)}
                                    >
                                        <Text className={draftSort === option.value ? 'text-white font-bold' : 'text-primary'}>
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className='text-primary font-bold mb-3'>Category</Text>
                            <View className='flex-row flex-wrap gap-2 mb-5'>
                                <TouchableOpacity
                                    className={`px-4 py-2 rounded-full border ${draftCategory === '' ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                                    onPress={() => setDraftCategory('')}
                                >
                                    <Text className={draftCategory === '' ? 'text-white font-bold' : 'text-primary'}>
                                        All
                                    </Text>
                                </TouchableOpacity>
                                {categories.map((category) => (
                                    <TouchableOpacity
                                        key={category}
                                        className={`px-4 py-2 rounded-full border ${draftCategory === category ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                                        onPress={() => setDraftCategory(category)}
                                    >
                                        <Text className={draftCategory === category ? 'text-white font-bold' : 'text-primary'}>
                                            {category}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className='text-primary font-bold mb-3'>Price range</Text>
                            <View className='flex-row gap-3 mb-6'>
                                <TextInput
                                    className='flex-1 bg-surface border border-gray-200 rounded-xl px-4 py-3 text-primary'
                                    placeholder='Min'
                                    keyboardType='numeric'
                                    value={draftMinPrice}
                                    onChangeText={setDraftMinPrice}
                                />
                                <TextInput
                                    className='flex-1 bg-surface border border-gray-200 rounded-xl px-4 py-3 text-primary'
                                    placeholder='Max'
                                    keyboardType='numeric'
                                    value={draftMaxPrice}
                                    onChangeText={setDraftMaxPrice}
                                />
                            </View>

                            <View className='flex-row gap-3'>
                                <TouchableOpacity
                                    className='flex-1 bg-surface border border-gray-200 rounded-xl py-4 items-center'
                                    onPress={resetFilters}
                                >
                                    <Text className='text-primary font-bold'>Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    className='flex-1 bg-primary rounded-xl py-4 items-center'
                                    onPress={applyFilters}
                                >
                                    <Text className='text-white font-bold'>Apply</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </SafeAreaView>
    );
}
