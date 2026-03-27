import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import { Dimensions, Image, ScrollView, Text, TouchableOpacity, View, Animated } from 'react-native';
import { BANNERS } from '../constants';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');
const BANNER_WIDTH = width - 32;
const BANNER_HEIGHT = 180;

export default function BannerCarousel() {
    const router = useRouter();
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const fadeAnim = useRef(new Animated.Value(1)).current;

    // Auto-scroll effect
    useEffect(() => {
        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % BANNERS.length;
            scrollViewRef.current?.scrollTo({ x: nextIndex * BANNER_WIDTH, animated: true });
        }, 4000);

        return () => clearInterval(interval);
    }, [activeIndex]);

    const handleScroll = (e: any) => {
        const slide = Math.round(e.nativeEvent.contentOffset.x / BANNER_WIDTH);
        if (slide !== activeIndex) {
            setActiveIndex(slide);
            // Fade animation
            Animated.sequence([
                Animated.timing(fadeAnim, { toValue: 0.7, duration: 100, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        }
    };

    return (
        <View className='mb-6'>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
                snapToInterval={BANNER_WIDTH}
                contentContainerStyle={{ paddingRight: 0 }}
            >
                {BANNERS.map((banner, index) => (
                    <TouchableOpacity
                        key={banner.id}
                        activeOpacity={0.95}
                        onPress={() => router.push('/shop')}
                        style={{ width: BANNER_WIDTH }}
                    >
                        <View 
                            className='rounded-2xl overflow-hidden'
                            style={{ 
                                height: BANNER_HEIGHT,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.15,
                                shadowRadius: 12,
                                elevation: 6,
                            }}
                        >
                            {/* Background Image */}
                            <Image 
                                source={{ uri: banner.image }} 
                                className='absolute w-full h-full' 
                                resizeMode='cover' 
                            />
                            
                            {/* Gradient Overlay */}
                            <View className='absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent' />
                            <View className='absolute inset-0' style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} />

                            {/* Content */}
                            <View className='flex-1 p-5 justify-between'>
                                <View>
                                    {/* Tag */}
                                    <View className='self-start bg-white/20 backdrop-blur px-3 py-1 rounded-full mb-3'>
                                        <Text className='text-white text-[10px] font-semibold uppercase tracking-wider'>
                                            {index === 0 ? 'New Collection' : index === 1 ? 'Limited Time' : 'Trending'}
                                        </Text>
                                    </View>
                                    
                                    {/* Title */}
                                    <Text className='text-white text-2xl font-bold' style={{ letterSpacing: -0.5 }}>
                                        {banner.title}
                                    </Text>
                                    <Text className='text-white/80 text-sm mt-1'>
                                        {banner.subtitle}
                                    </Text>
                                </View>

                                {/* CTA Button */}
                                <View className='flex-row items-center'>
                                    <View className='bg-white px-4 py-2.5 rounded-full flex-row items-center'>
                                        <Text className='text-primary font-bold text-xs mr-1'>Shop Now</Text>
                                        <Ionicons name='arrow-forward' size={12} color={COLORS.primary} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Pagination Dots */}
            <View className='flex-row justify-center mt-4 gap-1.5'>
                {BANNERS.map((_, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => {
                            scrollViewRef.current?.scrollTo({ x: index * BANNER_WIDTH, animated: true });
                        }}
                    >
                        <View 
                            className={`h-1.5 rounded-full transition-all ${
                                index === activeIndex 
                                    ? 'bg-primary' 
                                    : 'bg-gray-200'
                            }`}
                            style={{ 
                                width: index === activeIndex ? 24 : 8,
                            }}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
}
