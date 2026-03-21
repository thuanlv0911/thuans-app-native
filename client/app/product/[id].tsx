import { COLORS } from '@/constants/theme';
import { useAuth } from '@/src/context/AuthContext';
import { useCart } from '@/src/context/CartContext';
import { useWishlist } from '@/src/context/WishlistContext';
import { apiRequest } from '@/src/services/api';
import { Product } from '@/src/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToCart, itemCount } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await apiRequest<{ product: Product }>(`/products/${id}`);
        setProduct(data.product);
        setSelectedSize(data.product?.sizes?.[0] || 'M');
      } catch (error) {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-xl font-bold text-primary mb-4">The product does not exist</Text>
        <TouchableOpacity
          onPress={() => router.replace("/shop")}
          className="bg-primary px-8 py-4 rounded-full"
        >
          <Text className="text-white font-bold">Return to the shop</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isLiked = isInWishlist(product._id);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Login required",
        text2: "Log in to add products to your cart."
      });
      router.push("/sign-in");
      return;
    }

    await addToCart(product, selectedSize);
    Toast.show({
      type: "success",
      text1: "Added to cart",
      text2: `${product.name} (${selectedSize})`,
    });
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Login required",
        text2: "Log in to add to favorites list."
      });
      router.push("/sign-in");
      return;
    }

    await toggleWishlist(product);
    Toast.show({
      type: "success",
      text1: isLiked ? "Removed from wishlist" : "Added to wishlist",
      text2: product.name,
    });
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="relative h-[450px] bg-gray-100">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const slide = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(slide);
            }}
            scrollEventThrottle={16}
          >
            {product.images?.map((img, index) => (
              <Image
                key={index}
                source={{ uri: img }}
                style={{ width, height: 450 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          <View className="absolute top-12 left-4 right-4 flex-row justify-between z-10">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleToggleWishlist}
              className="w-10 h-10 bg-white/80 rounded-full items-center justify-center shadow-sm"
            >
              <Ionicons
                name={isLiked ? "heart" : "heart-outline"}
                size={24}
                color={isLiked ? COLORS.accent || "#ef4444" : COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {product.images && product.images.length > 1 && (
            <View className="absolute bottom-6 left-0 right-0 flex-row justify-center gap-2">
              {product.images.map((_, index) => (
                <View
                  key={index}
                  className={`h-2.5 rounded-full ${index === activeImageIndex ? 'w-6 bg-primary' : 'w-2.5 bg-gray-300'}`}
                />
              ))}
            </View>
          )}
        </View>

        <View className="px-5 pt-6 pb-10">
          <View className="flex-row justify-between items-start mb-4">
            <Text className="text-3xl font-bold text-primary flex-1 pr-4">{product.name}</Text>
          </View>

          <Text className="text-3xl font-bold text-primary mb-6">
            ${product.price.toFixed(2)}
          </Text>

          {product.sizes && product.sizes.length > 0 && (
            <View className="mb-8">
              <Text className="text-base font-bold text-primary mb-3">Size</Text>
              <View className="flex-row flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setSelectedSize(size)}
                    className={`w-14 h-14 rounded-2xl border-2 items-center justify-center ${selectedSize === size ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                  >
                    <Text className={`text-base font-medium ${selectedSize === size ? 'text-white' : 'text-primary'}`}>
                      {size}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text className="text-base font-bold text-primary mb-3">Description</Text>
          <Text className="text-gray-600 leading-7 mb-8">{product.description}</Text>

          <View className="bg-gray-50 rounded-2xl p-5">
            <Text className="text-base text-primary mb-2">
              Stock: <Text className="font-bold">{product.stock}</Text>
            </Text>
            <Text className="text-base text-primary mb-2">
              Category: <Text className="font-medium">{typeof product.category === 'string' ? product.category : product.category.name}</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4 flex-row items-center">
        <TouchableOpacity
          onPress={handleAddToCart}
          className="flex-1 py-4 rounded-full items-center shadow-md flex-row justify-center bg-primary"
        >
          <Ionicons name="bag-outline" size={22} color="white" />
          <Text className="text-white font-bold text-base ml-3">
            {isAuthenticated ? "Add to cart" : "Log in to buy"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(tabs)/cart")}
          className="ml-4 w-14 h-14 bg-gray-100 rounded-full items-center justify-center relative"
        >
          <Ionicons name="cart-outline" size={26} color={COLORS.primary} />
          {itemCount > 0 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-white text-xs font-bold">{itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
