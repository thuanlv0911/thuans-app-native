
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Product, WishlistContextType } from "../types";
import { dummyWishlist } from "../constants";
import { useAuth } from "./AuthContext";
import Toast from "react-native-toast-message";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();

    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchWishlist = async () => {
        if (!isAuthenticated) {
            setWishlist([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setWishlist(dummyWishlist);
        setLoading(false);
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

        setWishlist((prev) => {
            const exists = prev.some((p) => p._id === product._id);

            if (exists) {
                return prev.filter((p) => p._id !== product._id);
            }
            return [...prev, product];
        })
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
