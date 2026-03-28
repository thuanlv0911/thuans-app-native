import { CATEGORIES } from '@/constants/theme';
import CategoryItem from '@/src/components/CategoryItem';
import Header from '@/src/components/Header';
import ProductCard from '@/src/components/ProductCard';
import { BANNERS } from '@/src/constants';
import { apiRequest } from '@/src/services/api';
import { Product } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get("window");

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
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
        <View className='bg-yellow-50 rounded-2xl p-5 mb-6 border border-yellow-100'>
          <Text className='text-lg font-bold text-primary'>Hello{user?.name ? `, ${user.name}` : ''}!</Text>
          <Text className='text-secondary mt-1'>Welcome back to your curated shop dashboard.</Text>
        </View>
        <View className='mb-6'>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className='w-full h-48 rounded-xl'
            scrollEventThrottle={16}
            onScroll={(e) => {
              const slide = Math.ceil(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              if (slide !== activeBannerIndex) {
                setActiveBannerIndex(slide);
              }
            }}
          >
            {BANNERS.map((banner, index) => (
              <View key={index} className='relative w-full h-48 bg-gray-200 overflow-hidden' style={{ width: width - 32 }}>
                <Image source={{ uri: banner.image }} className='w-full h-full' resizeMode='cover' />
                <View className='absolute inset-0 bg-black/40' />

                <View className='absolute bottom-4 left-4 z-10'>
                  <Text className='text-white text-2xl font-bold'>{banner.title}</Text>
                  <Text className='text-white text-sm font-medium'>{banner.subtitle}</Text>
                  <TouchableOpacity className='mt-3 bg-white px-4 py-2 rounded-full self-start' onPress={() => router.push('/shop')}>
                    <Text className='text-primary font-bold text-xs'>GET NOW</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          <View className='flex-row justify-center mt-3 gap-2'>
            {BANNERS.map((_, index) => (
              <View key={index} className={`h-2 rounded-full ${index === activeBannerIndex ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`} />
            ))}
          </View>
        </View>



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
            <View className='flex-row flex-wrap justify-between'>
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
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
            <View className='flex-row flex-wrap justify-between'>
              {newArrivals.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
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
            <View className='flex-row flex-wrap justify-between'>
              {outOfStockProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </View>
          )}
        </View>

        {/* <View className='bg-gray-100 p-6 rounded-2xl mb-20 items-center'>
          <Text className='text-2xl font-bold text-primary mb-2 text-center'>Join in Revolution</Text>
          <Text className='text-secondary text-center mb-4'>Subscribe to our newsletter and get 10% off your first purchase.</Text>
          <TouchableOpacity onPress={() => router.push("/sign-up")} className='bg-primary w-4/5 py-3 rounded-full items-center'>
            <Text className='text-white font-medium text-base'>Register Now</Text>
          </TouchableOpacity>
        </View> */}
        <View className='mx-4 mt-8 mb-24'>
          <View
            className='bg-primary rounded-3xl p-6 overflow-hidden'
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className='flex-row items-center mb-3'>
              <View className='w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3'>
                <Ionicons name='gift-outline' size={20} color='#FFF' />
              </View>
              <Text className='text-white/80 text-sm font-medium'>Special Offer</Text>
            </View>
            <Text className='text-white text-2xl font-bold mb-2'>Get 10% Off</Text>
            <Text className='text-white/70 text-sm mb-5'>
              Join our newsletter and receive exclusive deals and updates.
            </Text>
            <TouchableOpacity
              className='bg-white py-3.5 rounded-full items-center'
              onPress={() => router.push('/')}
            >
              <Text className='text-primary font-bold text-base'>Join Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
