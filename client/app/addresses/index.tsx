import { COLORS } from "@/constants/theme";
import AuthRequiredState from "@/src/components/AuthRequiredState";
import Header from "@/src/components/Header";
import { useAuth } from "@/src/context/AuthContext";
import { apiRequest } from "@/src/services/api";
import { Address } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Addresses() {
    const params = useLocalSearchParams<{ select?: string; selectedAddressId?: string }>();
    const router = useRouter();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    const [type, setType] = useState("Home");
    const [thonToDanPho, setThonToDanPho] = useState("");
    const [xaPhuong, setXaPhuong] = useState("");
    const [quanHuyen, setQuanHuyen] = useState("");
    const [tinhThanh, setTinhThanh] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const { token, isAuthenticated } = useAuth();

    const isSelectionMode = params.select === "true";
    const selectedAddressId = typeof params.selectedAddressId === "string" ? params.selectedAddressId : "";

    const fetchAddresses = useCallback(async () => {
        setLoading(true);
        try {
            if (!token) {
                setAddresses([]);
                return;
            }

            const data = await apiRequest<{ addresses: Address[] }>('/addresses', { token });
            setAddresses(data.addresses ?? []);
        } catch (error) {
            console.warn('fetchAddresses:', error);
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleEditSearch = (item: Address) => {
        setIsEditing(true);
        setEditingId(item._id);
        setType(item.type);
        setThonToDanPho(item.thonToDanPho);
        setXaPhuong(item.xaPhuong);
        setQuanHuyen(item.quanHuyen || '');
        setTinhThanh(item.tinhThanh);
        setIsDefault(item.isDefault);
        setModalVisible(true);
    };

    const handleSaveAddress = async () => {
        if (!thonToDanPho || !xaPhuong || !tinhThanh) {
            alert('Please fill in the full address.');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                type,
                thonToDanPho,
                xaPhuong,
                quanHuyen,
                tinhThanh,
                isDefault,
            };

            const data = await apiRequest<{ address: Address }>(editingId ? `/addresses/${editingId}` : '/addresses', {
                method: editingId ? 'PUT' : 'POST',
                token,
                body: payload,
            });

            setModalVisible(false);
            resetForm();
            await fetchAddresses();

            if (isSelectionMode && data.address?._id) {
                router.replace({
                    pathname: '/checkout',
                    params: { selectedAddressId: data.address._id },
                });
            }
        } catch (error) {
            console.error('handleSaveAddress:', error);
            alert('Failed to save address, please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            await apiRequest(`/addresses/${id}`, {
                method: 'DELETE',
                token,
            });
            await fetchAddresses();
        } catch (error) {
            console.error('handleDeleteAddress:', error);
            alert('Failed to delete address, please try again.');
        }
    };

    const handleSelectAddress = (id: string) => {
        router.replace({
            pathname: '/checkout',
            params: { selectedAddressId: id },
        });
    };

    const resetForm = () => {
        setThonToDanPho("");
        setXaPhuong("");
        setQuanHuyen("");
        setTinhThanh("");
        setType("Home");
        setIsDefault(false);
        setIsEditing(false);
        setEditingId(null);
    };

    const openAddModal = () => {
        resetForm();
        setModalVisible(true);
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="Shipping Addresses" showBack />

            {!isAuthenticated ? (
                <AuthRequiredState
                    title="Login to view your addresses"
                    description="Please log in to save and manage your shipping addresses."
                />
            ) : loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView className="flex-1 px-4 pt-4">
                    {isSelectionMode && (
                        <View className="bg-primary/5 border border-primary/10 rounded-xl p-4 mb-4">
                            <Text className="text-primary font-bold mb-1">Select shipping address</Text>
                            <Text className="text-secondary">
                                Choose an address here, then return to checkout with your chosen address.
                            </Text>
                        </View>
                    )}



                    {addresses.length === 0 ? (
                        <Text className="text-center text-secondary mt-10">No addresses found</Text>
                    ) : (
                        addresses.map((item) => {
                            const isSelected = selectedAddressId === item._id;

                            return (
                                <TouchableOpacity
                                    key={item._id}
                                    className={`bg-white p-4 rounded-xl mb-4 shadow-sm border ${isSelected ? 'border-primary' : 'border-transparent'}`}
                                    activeOpacity={isSelectionMode ? 0.8 : 1}
                                    onPress={isSelectionMode ? () => handleSelectAddress(item._id) : undefined}
                                >
                                    <View className="flex-row items-center justify-between mb-2">
                                        <View className="flex-row items-center flex-1 pr-3">
                                            <Ionicons
                                                name={item.type === "Home" ? "home-outline" : "briefcase-outline"}
                                                size={20}
                                                color={COLORS.primary}
                                            />
                                            <Text className="text-base font-bold text-primary ml-2">{item.type}</Text>
                                            {item.isDefault && (
                                                <View className="bg-primary/10 px-2 py-1 rounded ml-2">
                                                    <Text className="text-primary text-xs font-bold">Default</Text>
                                                </View>
                                            )}
                                            {isSelected && isSelectionMode && (
                                                <View className="bg-green-100 px-2 py-1 rounded ml-2">
                                                    <Text className="text-green-700 text-xs font-bold">Selected</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View className="flex-row items-center gap-4">
                                            {!isSelectionMode && (
                                                <>
                                                    <TouchableOpacity onPress={() => handleEditSearch(item)}>
                                                        <Ionicons name="pencil-outline" size={20} color={COLORS.secondary} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => handleDeleteAddress(item._id)}>
                                                        <Ionicons name="trash-outline" size={20} color={COLORS.error || '#ff4444'} />
                                                    </TouchableOpacity>
                                                </>
                                            )}


                                        </View>
                                    </View>
                                    <Text className="text-secondary leading-5 ml-7">
                                        {item.thonToDanPho}, {item.xaPhuong}
                                        {item.quanHuyen ? `, ${item.quanHuyen}` : ''}
                                        {`, ${item.tinhThanh}`}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })
                    )}

                    <TouchableOpacity className="flex-row items-center justify-center p-4 border border-dashed border-gray-300 rounded-xl mt-2 mb-8" onPress={openAddModal}>
                        <Ionicons name="add" size={24} color={COLORS.secondary} />
                        <Text className="text-secondary font-medium ml-2">Add New Address</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-3xl p-6 h-[85%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-bold text-primary">{isEditing ? "Edit Address" : "Add New Address"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text className="text-primary font-medium mb-2">Label</Text>
                            <View className="flex-row gap-3 mb-4">
                                {["Home", "Work", "Other"].map((label) => (
                                    <TouchableOpacity key={label} onPress={() => setType(label)} className={`px-4 py-2 rounded-full border ${type === label ? 'bg-primary border-primary' : 'bg-white border-gray-300'}`}>
                                        <Text className={type === label ? 'text-white' : 'text-primary'}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className="text-primary font-medium mb-2">Thon/To dan pho</Text>
                            <TextInput className="bg-surface p-4 rounded-xl text-primary mb-4" placeholder="Thon Trung Hoa" value={thonToDanPho} onChangeText={setThonToDanPho} />

                            <Text className="text-primary font-medium mb-2">Xa/Phuong</Text>
                            <TextInput className="bg-surface p-4 rounded-xl text-primary mb-4" placeholder="Phuong Yen Hoa" value={xaPhuong} onChangeText={setXaPhuong} />

                            <Text className="text-primary font-medium mb-2">Quan/Huyen (tuy chon)</Text>
                            <TextInput className="bg-surface p-4 rounded-xl text-primary mb-4" placeholder="Quan Cau Giay" value={quanHuyen} onChangeText={setQuanHuyen} />

                            <Text className="text-primary font-medium mb-2">Tinh/Thanh pho</Text>
                            <TextInput className="bg-surface p-4 rounded-xl text-primary mb-4" placeholder="Ha Noi" value={tinhThanh} onChangeText={setTinhThanh} />

                            <TouchableOpacity className="flex-row items-center mb-8" onPress={() => setIsDefault(!isDefault)}>
                                <View className={`w-5 h-5 border rounded mr-2 items-center justify-center ${isDefault ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                                    {isDefault && <Ionicons name="checkmark" size={14} color="white" />}
                                </View>
                                <Text className="text-primary">Set as default address</Text>
                            </TouchableOpacity>

                            <TouchableOpacity className="w-full bg-primary py-4 rounded-full items-center mb-10" onPress={handleSaveAddress} disabled={submitting}>
                                {submitting ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Save Address</Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
