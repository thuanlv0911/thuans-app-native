import { COLORS } from "@/constants/theme";
import Header from "@/src/components/Header";
import { dummyProducts } from "@/src/constants";
import { useAuth } from "@/src/context/AuthContext";
import { useCart } from "@/src/context/CartContext";
import { Product } from "@/src/types";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const product = dummyProducts.find((item) => item._id === id) as Product | undefined;

  const [selectedSize, setSelectedSize] = useState(product?.sizes?.[0] || "M");

  if (!product) {
    return (
      <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
        <Header title="Product" showBack />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-primary">Product not found</Text>
          <TouchableOpacity
            onPress={() => router.replace("/shop")}
            className="mt-6 rounded-full bg-primary px-6 py-3"
          >
            <Text className="font-bold text-white">Back to shop</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      Toast.show({
        type: "info",
        text1: "Can dang nhap",
        text2: "Dang nhap de them san pham vao gio hang.",
      });
      router.push("/sign-in");
      return;
    }

    await addToCart(product, selectedSize);
    Toast.show({
      type: "success",
      text1: "Da them vao gio hang",
      text2: `${product.name} (${selectedSize})`,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
      <Header title="Product" showBack showCart />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <Image
          source={{ uri: product.images?.[0] ?? "" }}
          className="h-96 w-full bg-gray-100"
          resizeMode="cover"
        />

        <View className="rounded-t-3xl bg-white px-5 py-6">
          <Text className="text-3xl font-bold text-primary">{product.name}</Text>
          <Text className="mt-3 text-2xl font-bold text-primary">${product.price.toFixed(2)}</Text>
          <Text className="mt-4 text-base leading-6 text-secondary">{product.description}</Text>

          <View className="mt-6">
            <Text className="text-sm font-semibold uppercase tracking-[1px] text-gray-500">Size</Text>
            <View className="mt-3 flex-row flex-wrap gap-3">
              {(product.sizes?.length ? product.sizes : ["M"]).map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  className={`rounded-full border px-4 py-3 ${selectedSize === size ? "border-primary bg-primary" : "border-gray-300 bg-white"}`}
                >
                  <Text className={`font-semibold ${selectedSize === size ? "text-white" : "text-primary"}`}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mt-8 rounded-2xl bg-gray-50 p-4">
            <Text className="text-base text-primary">Stock: {product.stock}</Text>
            <Text className="mt-2 text-base text-primary">Rating: {product.ratings.average.toFixed(1)}</Text>
            <Text className="mt-2 text-base text-primary">Category: {typeof product.category === "string" ? product.category : product.category.name}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-gray-100 bg-white px-5 py-4">
        <TouchableOpacity
          onPress={handleAddToCart}
          className="items-center rounded-full bg-primary py-4"
        >
          <Text className="text-lg font-bold text-white">
            {isAuthenticated ? "Add to cart" : "Login to add to cart"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
