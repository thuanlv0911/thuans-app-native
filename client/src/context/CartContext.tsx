
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Product } from "../types";
import { useAuth } from "./AuthContext";
import Toast from "react-native-toast-message";
import { apiRequest } from "../services/api";

export type CartItem = {
    id: string;
    productId: string;
    product: Product;
    quantity: number;
    size: string;
    price: number;
}

type CartContextType = {
    cartItems: CartItem[],
    addToCart: (product: Product, size: string) => Promise<boolean>;
    removeFromCart: (itemId: string, size: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number, size: string) => Promise<boolean>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    itemCount: number;
    isLoading: boolean;

}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, token, user } = useAuth();

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [cartTotal, setCartTotal] = useState(0);

    const fetchCart = async () => {
        if (!isAuthenticated) {
            setCartItems([]);
            setCartTotal(0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const data = await apiRequest<{ cart: { items: any[]; totalAmount: number } }>("/cart", {
                token,
            });

            const mappedItems: CartItem[] = (data.cart?.items || []).map((item: any) => ({
                id: item._id,
                productId: item.product?._id,
                product: item.product,
                quantity: item.quantity,
                size: item.size,
                price: item.price,
            }));

            setCartItems(mappedItems);
            setCartTotal(data.cart?.totalAmount || 0);
        } catch (error) {
            Toast.show({
                type: "error",
                text1: "Khong tai duoc gio hang",
                text2: error instanceof Error ? error.message : "Vui long thu lai sau.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const ensureAuthenticated = () => {
        if (!isAuthenticated) {
            Toast.show({
                type: "info",
                text1: "Can dang nhap",
                text2: "Ban can dang nhap moi co the them san pham vao gio hang.",
            });
            return false;
        }

        return true;
    }

    const addToCart = async (product: Product, size: string) => {
        if (!ensureAuthenticated()) {
            return false;
        }

        if (product.stock <= 0 || !product.isActive) {
            Toast.show({
                type: "info",
                text1: "Out of stock",
                text2: "This product is currently unavailable.",
            });
            return false;
        }

        const existingItem = cartItems.find((item) => item.productId === product._id && item.size === size);
        const nextQuantity = (existingItem?.quantity || 0) + 1;

        if (nextQuantity > product.stock) {
            Toast.show({
                type: "error",
                text1: "Stock limit reached",
                text2: `Only ${product.stock} item(s) available.`,
            });
            return false;
        }

        await apiRequest("/cart/items", {
            method: "POST",
            token,
            body: { productId: product._id, size, quantity: 1 },
        });

        await fetchCart();
        return true;
    }
    const removeFromCart = async (productId: string, size: string) => {
        if (!ensureAuthenticated()) {
            return;
        }

        await apiRequest("/cart/items", {
            method: "DELETE",
            token,
            body: { productId, size },
        });

        await fetchCart();
    }

    const updateQuantity = async (productId: string, quantity: number, size: string = "M") => {
        if (!ensureAuthenticated()) {
            return false;
        }

        if (quantity <= 0) {
            await removeFromCart(productId, size);
            return true;
        }

        const cartItem = cartItems.find((item) => item.productId === productId && item.size === size);

        if (cartItem && quantity > cartItem.product.stock) {
            Toast.show({
                type: "error",
                text1: "Stock limit reached",
                text2: `Only ${cartItem.product.stock} item(s) available.`,
            });
            return false;
        }

        await apiRequest("/cart/items", {
            method: "PUT",
            token,
            body: { productId, size, quantity },
        });

        await fetchCart();
        return true;
    }

    const clearCart = async () => {
        if (!isAuthenticated) {
            setCartItems([]);
            setCartTotal(0);
            return;
        }

        await apiRequest("/cart", {
            method: "DELETE",
            token,
        });

        setCartItems([]);
        setCartTotal(0);
    }
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    useEffect(() => {
        fetchCart();
    }, [isAuthenticated, user?.id])

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, itemCount, isLoading }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}

