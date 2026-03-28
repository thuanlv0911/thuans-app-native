import { COLORS, PROFILE_MENU } from '@/constants/theme';
import Header from '@/src/components/Header';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';


export default function Profile() {
    const { user, isLoading, signOut, updateName } = useAuth();
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [nameInput, setNameInput] = React.useState(user?.name || '');
    const router = useRouter();

    React.useEffect(() => {
        setNameInput(user?.name || '');
    }, [user?.name]);

    const handleSignOut = async () => {
        await signOut();
        Toast.show({
            type: 'success',
            text1: 'Logged out',
            position: 'top',
        });
    };

    const handleSaveName = async () => {
        const trimmedName = nameInput.trim();
        if (!trimmedName) {
            Toast.show({ type: 'error', text1: 'Tên không được để trống' });
            return;
        }

        try {
            await updateName(trimmedName);
            setIsEditingName(false);
            Toast.show({ type: 'success', text1: 'Updated name successfully.' });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: 'Unable to update name',
                text2: error instanceof Error ? error.message : 'Please try again.',
            });
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-surface">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
                <Header title="Profile" showMenu showCart />
                <ScrollView
                    className="flex-1 px-4"
                    contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                >
                    <View className="items-center w-full">
                        <View className="mb-6">
                            <Ionicons name="person" size={64} color={COLORS.secondary} />
                        </View>
                        <Text className="text-primary font-bold text-2xl mb-3">Guest</Text>
                        <Text className="text-secondary text-base mb-10 text-center w-4/5">
                            Please log in to view your personal information, orders, and address
                        </Text>

                        <TouchableOpacity
                            className="bg-primary w-4/5 py-4 rounded-full items-center shadow-md"
                            onPress={() => router.push('/sign-in')}
                        >
                            <Text className="text-white font-bold text-lg">Login / Register</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="mt-4 border border-gray-300 w-4/5 py-4 rounded-full items-center"
                            onPress={() => router.push('/sign-up')}
                        >
                            <Text className="text-primary font-semibold text-lg">Create new account</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="Profile" showMenu showCart />

            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}>
                <View className="items-center mb-10 w-full">
                    <View className="mb-3">
                        <Ionicons name="person-circle" size={80} color={COLORS.primary} />
                    </View>

                    {isEditingName ? (
                        <View className="w-full px-8">
                            <TextInput
                                value={nameInput}
                                onChangeText={setNameInput}
                                className="border border-gray-200 bg-white rounded-full px-4 py-3 text-primary"
                                placeholder="Enter your name"
                            />
                            <View className="flex-row justify-center mt-3 gap-3">
                                <TouchableOpacity onPress={handleSaveName} className="bg-primary px-5 py-2 rounded-full">
                                    <Text className="text-white font-semibold">Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => { setIsEditingName(false); setNameInput(user.name || ''); }} className="border border-gray-300 px-5 py-2 rounded-full">
                                    <Text className="text-primary font-semibold">Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text className="text-4xl font-bold text-primary">{user.name || 'User'}</Text>
                            <Text className="text-secondary text-base mt-1">Email: {user.email}</Text>
                            <TouchableOpacity onPress={() => setIsEditingName(true)} className="mt-3 bg-primary px-6 py-2 rounded-full">
                                <Text className="text-white font-semibold">Edit Name</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* Menu */}
                <View className="mb-6">
                    {PROFILE_MENU.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            className={`flex-row items-center p-4 ${index !== PROFILE_MENU.length - 1 ? 'border-b border-gray-100' : ''
                                }`}
                            onPress={() => router.push(item.route as any)}
                        >
                            <View className="w-11 h-11 bg-white rounded-full items-center justify-center mr-4 shadow-sm">
                                <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
                            </View>
                            <Text className="flex-1 text-primary font-medium text-base">{item.title}</Text>
                            <Ionicons name="chevron-forward" size={22} color={COLORS.secondary} />
                        </TouchableOpacity>
                    ))}
                </View>


                <View className='mx-4 mt-6'>
                    <TouchableOpacity
                        className='flex-row items-center justify-center p-4 bg-red-50 rounded-2xl'
                        onPress={handleSignOut}
                    >
                        <Ionicons name='log-out-outline' size={22} color='#EF4444' />
                        <Text className='text-red-500 font-bold text-base ml-2'>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
