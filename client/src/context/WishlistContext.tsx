
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Product, WishlistContextType } from "../types";
import { useAuth } from "./AuthContext";
import Toast from "react-native-toast-message";
import { apiRequest } from "../services/api";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, token, user } = useAuth();

    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWishlist = async () => {
        if (!isAuthenticated) {
            setWishlist([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const data = await apiRequest<{ products: Product[] }>("/wishlist", { token });
            setWishlist(data.products || []);
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Khong tai duoc wishlist",
                text2: error instanceof Error ? error.message : "Vui long thu lai sau.",
            });
        } finally {
            setLoading(false);
        }
    }

    const toggleWishlist = async (product: Product) => {
        if (!isAuthenticated) {
            Toast.show({
                type: "info",
                text1: "Can dang nhap",
                text2: "Ban can dang nhap moi co the su dung wishlist.",
            });
            return;
        }

        const data = await apiRequest<{ products: Product[] }>("/wishlist/toggle", {
            method: "POST",
            token,
            body: { productId: product._id },
        });

        setWishlist(data.products || []);
    }
    const isInWishlist = (productId: string) => {
        return wishlist.some((p) => p._id === productId);
    }

    useEffect(() => {
        fetchWishlist();
    }, [isAuthenticated, user?.id])

    return (
        <WishlistContext.Provider value={{ wishlist, loading, isInWishlist, toggleWishlist }}>
            {children}
        </WishlistContext.Provider>
    )
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (context === undefined) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
