import { CATEGORIES } from '@/constants/theme';
import CategoryItem from '@/src/components/CategoryItem';
import Header from '@/src/components/Header';
import ProductCard from '@/src/components/ProductCard';
import { BANNERS } from '@/src/constants';
import { apiRequest } from '@/src/services/api';
import { Product } from '@/src/types';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window")

export default function Home() {

  const router = useRouter();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        apiRequest<{ products: Product[] }>('/products?featured=true&limit=4'),
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
  }

  useEffect(() => {
    fetchProducts();
  }, [])

  return (
    <SafeAreaView className='flex-1' edges={['top']}>
      <Header title='Nodaco' showMenu showCart showLogo />
      <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View className='mb-6'>
          <ScrollView horizontal pagingEnabled
            showsHorizontalScrollIndicator={false}
            className='w-full h-48 rounded-xl' scrollEventThrottle={16}
            onScroll={(e) => {
              const slide = Math.ceil(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width)
              if (slide !== activeBannerIndex) {
                setActiveBannerIndex(slide);
              }
            }}>
            {BANNERS.map((banner, index) => (
              <View key={index} className='relative w-full h-48 bg-gray-200 overflow-hidden' style={{ width: width - 32 }}>
                <Image source={{ uri: banner.image }}
                  className='w-full h-full' resizeMode='cover' />
                <View className='absolute inset-0 bg-black/40' />

                <View className='absolute bottom-4 left-4 z-10'>
                  <Text className='text-white text-2xl font-bold'>{banner.title}</Text>
                  <Text className='text-white text-sm font-medium'>{banner.subtitle}</Text>
                  <TouchableOpacity className='mt-3 bg-white px-4 py-2 rounded-full self-start'
                    onPress={() => router.push('/shop')}>
                    <Text className='text-primary font-bold text text-xs'>GET NOW</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          {/* Pagination Dots */}
          <View className='flex-row justify-center mt-3 gap-2'>
            {BANNERS.map((_, index) => (
              <View key={index} className={`h-2 rounded-full ${index === activeBannerIndex ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`} />
            ))}
          </View>
        </View>
        {/* Categories */}
        <View className='mb-6'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-xl font-bold text-primary'>Categories</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat: any) => (
              <CategoryItem key={cat.id} item={cat} isSelected={false} onPress={() => router.push({ pathname: "/shop", params: { category: cat.id === 'all' ? '' : cat.name } })} />
            ))}
          </ScrollView>
        </View>

        {/* Popular products */}
        <View className='mb-8'>
          <View className='flex-row justify-between items-center mb-4'>
            <Text className='text-xl font-bold text-primary'>Popular</Text>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <Text className='text-secondary text-sm'>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size='large' />
          ) : (
            <View className='flex-row flex-wrap justify-between'>
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
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
  )
}
