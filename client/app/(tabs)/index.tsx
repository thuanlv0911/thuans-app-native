import { CATEGORIES, COLORS } from '@/constants/theme';
import BannerCarousel from '@/src/components/BannerCarousel';
import CategoryItem from '@/src/components/CategoryItem';
import Header from '@/src/components/Header';
import MasonryList from '@/src/components/MasonryList';
import { apiRequest } from '@/src/services/api';
import { Product } from '@/src/types';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const featuredProducts = useMemo(
    () => products.filter((product) => product.isFeatured).slice(0, 4),
    [products]
  );

  const newArrivals = useMemo(
    () => products.filter((product) => !product.isFeatured && product.stock > 0).slice(0, 6),
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

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push({ pathname: '/shop', params: { search: searchQuery.trim() } });
    }
  };

  return (
    <SafeAreaView className='flex-1 bg-surface' edges={['top']}>
      <Header title='Nodaco' showMenu showCart showLogo />

      <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
        {/* Welcome & Search Section */}
        <View className='px-4 pt-2 pb-4'>
          <View className='flex-row items-center justify-between mb-4'>
            <View>
              <Text className='text-2xl font-bold text-primary'>
                Hello{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
              </Text>
              <Text className='text-secondary text-sm mt-0.5'>What are you looking for today?</Text>
            </View>
            <TouchableOpacity 
              className='w-11 h-11 bg-white rounded-full items-center justify-center'
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 2,
              }}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name='notifications-outline' size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View 
            className='flex-row items-center bg-white rounded-2xl px-4 py-3'
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Ionicons name='search-outline' size={20} color={COLORS.secondary} />
            <TextInput
              className='flex-1 ml-3 text-primary text-base'
              placeholder='Search products...'
              placeholderTextColor={COLORS.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType='search'
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name='close-circle' size={20} color={COLORS.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Banner Carousel */}
        <View className='px-4'>
          <BannerCarousel />
        </View>

        {/* Categories */}
        <View className='mt-6'>
          <View className='flex-row justify-between items-center px-4 mb-3'>
            <Text className='text-lg font-bold text-primary'>Categories</Text>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <Text className='text-secondary text-sm'>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
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

        {/* Featured Products */}
        <View className='mt-6 px-4'>
          <View className='flex-row justify-between items-center mb-4'>
            <View className='flex-row items-center'>
              <View className='w-1 h-5 bg-primary rounded-full mr-2' />
              <Text className='text-lg font-bold text-primary'>Featured</Text>
            </View>
            <TouchableOpacity 
              className='flex-row items-center'
              onPress={() => router.push('/shop')}
            >
              <Text className='text-secondary text-sm mr-1'>View All</Text>
              <Ionicons name='arrow-forward' size={14} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View className='py-10 items-center'>
              <ActivityIndicator size='large' color={COLORS.primary} />
            </View>
          ) : featuredProducts.length === 0 ? (
            <View className='bg-white rounded-2xl p-6 items-center'>
              <Ionicons name='cube-outline' size={40} color={COLORS.secondary} />
              <Text className='text-secondary mt-3'>No featured products</Text>
            </View>
          ) : (
            <MasonryList products={featuredProducts} />
          )}
        </View>

        {/* New Arrivals */}
        <View className='mt-6 px-4'>
          <View className='flex-row justify-between items-center mb-4'>
            <View className='flex-row items-center'>
              <View className='w-1 h-5 bg-accent rounded-full mr-2' />
              <Text className='text-lg font-bold text-primary'>New Arrivals</Text>
            </View>
            <TouchableOpacity 
              className='flex-row items-center'
              onPress={() => router.push('/shop')}
            >
              <Text className='text-secondary text-sm mr-1'>Explore</Text>
              <Ionicons name='arrow-forward' size={14} color={COLORS.secondary} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <View className='py-10 items-center'>
              <ActivityIndicator size='large' color={COLORS.primary} />
            </View>
          ) : newArrivals.length === 0 ? (
            <View className='bg-white rounded-2xl p-6 items-center'>
              <Ionicons name='sparkles-outline' size={40} color={COLORS.secondary} />
              <Text className='text-secondary mt-3'>No new arrivals</Text>
            </View>
          ) : (
            <MasonryList products={newArrivals} />
          )}
        </View>

        {/* Newsletter CTA */}
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
              onPress={() => router.push('/sign-up')}
            >
              <Text className='text-primary font-bold text-base'>Join Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
