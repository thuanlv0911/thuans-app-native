import { CATEGORIES } from '@/constants/theme';
import BannerCarousel from '@/src/components/BannerCarousel';
import CategoryItem from '@/src/components/CategoryItem';
import Header from '@/src/components/Header';
import MasonryList from '@/src/components/MasonryList';
import { apiRequest } from '@/src/services/api';
import { Product } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.isFeatured).slice(0, 4),
    [products]
  );

  const outOfStockProducts = useMemo(
    () => products.filter((product) => product.stock === 0 || !product.isActive).slice(0, 4),
    [products]
  );

  const newArrivals = useMemo(
    () => products.filter((product) => !product.isFeatured && product.stock > 0).slice(0, 4),
    [products]
  );

  const fetchProducts = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        apiRequest<{ products: Product[] }>('/products?limit=40'),
        apiRequest<{ categories: string[] }>('/products/categories'),
      ]);

      setProducts(productsData.products || []);
      setCategories([
        { id: 'all', name: 'All', icon: 'grid' },
        ...(categoriesData.categories || []).map((categoryName, index) => {
          const matchedCategory = CATEGORIES.find((item) => item.name.toLowerCase() === categoryName.toLowerCase());

          return {
            id: `${categoryName}-${index}`,
            name: categoryName,
            icon: matchedCategory?.icon || 'grid-outline',
          };
        }),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <Header title='Nodaco' showMenu showCart showLogo />

      <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View className='flex-row items-center justify-between mb-5'>
          <View>
            <Text className='text-lg font-bold text-primary'>Hello{user?.name ? `, ${user.name}` : ''}!</Text>
            <Text className='text-secondary text-sm'>Find your style today</Text>
          </View>
          <TouchableOpacity 
            className='bg-primary/10 p-2.5 rounded-full'
            onPress={() => router.push('/shop')}
          >
            <Text className='text-primary text-xs font-semibold'>Explore</Text>
          </TouchableOpacity>
        </View>

        {/* Banner Carousel */}
        <BannerCarousel />



        <View className='mb-6'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-xl font-bold text-primary'>Categories</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat: any) => (
              <CategoryItem
                key={cat.id}
                item={cat}
                isSelected={false}
                onPress={() => router.push({ pathname: "/shop", params: { category: cat.id === 'all' ? '' : cat.name } })}
              />
            ))}
          </ScrollView>
        </View>



        <View className='mb-6'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-xl font-bold text-primary'>Featured Picks</Text>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <Text className='text-secondary text-sm'>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size='large' />
          ) : featuredProducts.length === 0 ? (
            <Text className='text-secondary'>No featured products right now. Browse all.</Text>
          ) : (
            <MasonryList products={featuredProducts} />
          )}
        </View>

        <View className='mb-8'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-xl font-bold text-primary'>New Arrivals</Text>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <Text className='text-secondary text-sm'>Explore</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size='large' />
          ) : newArrivals.length === 0 ? (
            <Text className='text-secondary'>No new arrivals for now. Check stock soon.</Text>
          ) : (
            <MasonryList products={newArrivals} />
          )}
        </View>

        <View className='mb-8'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-xl font-bold text-primary'>Out of Stock Watchlist</Text>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <Text className='text-secondary text-sm'>All Products</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size='large' />
          ) : outOfStockProducts.length === 0 ? (
            <Text className='text-secondary'>No products are out of stock.</Text>
          ) : (
            <MasonryList products={outOfStockProducts} />
          )}
        </View>

        <View className='bg-gray-100 p-6 rounded-2xl mb-20 items-center'>
          <Text className='text-2xl font-bold text-primary mb-2 text-center'>Join in Revolution</Text>
          <Text className='text-secondary text-center mb-4'>Subscribe to our newsletter and get 10% off your first purchase.</Text>
          <TouchableOpacity onPress={() => router.push("/sign-up")} className='bg-primary w-4/5 py-3 rounded-full items-center'>
            <Text className='text-white font-medium text-base'>Register Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
