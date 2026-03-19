
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { Product } from "../types";
import { dummyCart } from "../constants";
import { useAuth } from "./AuthContext";
import Toast from "react-native-toast-message";

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
    addToCart: (product: Product, size: string) => Promise<void>;
    removeFromCart: (itemId: string, size: string) => Promise<void>;
    updateQuantity: (itemId: string, quantity: number, size: string) => Promise<void>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    itemCount: number;
    isLoading: boolean;

}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated, user } = useAuth();

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
        const serverCart = dummyCart;
        const mappedItems: CartItem[] = serverCart.items.map((item: any) => ({
            id: item.product._id,
            productId: item.product._id,
            product: item.product,
            quantity: item.quantity,
            size: item.size,
            price: item.price
        }));
        setCartItems(mappedItems);
        setCartTotal(serverCart.totalAmount);
        setIsLoading(false);
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
            return;
        }

        setCartItems((prev) => {
            const existingItem = prev.find((item) => item.productId === product._id && item.size === size);

            if (existingItem) {
                return prev.map((item) =>
                    item.productId === product._id && item.size === size
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...prev,
                {
                    id: `${product._id}-${size}`,
                    productId: product._id,
                    product,
                    quantity: 1,
                    size,
                    price: product.price,
                },
            ];
        });

        setCartTotal((prev) => prev + product.price);
    }
    const removeFromCart = async (productId: string, size: string) => {
        if (!ensureAuthenticated()) {
            return;
        }

        setCartItems((prev) => {
            const target = prev.find((item) => item.productId === productId && item.size === size);

            if (target) {
                setCartTotal((currentTotal) => Math.max(0, currentTotal - target.price * target.quantity));
            }

            return prev.filter((item) => !(item.productId === productId && item.size === size));
        });
    }

    const updateQuantity = async (productId: string, quantity: number, size: string = "M") => {
        if (!ensureAuthenticated()) {
            return;
        }

        if (quantity <= 0) {
            await removeFromCart(productId, size);
            return;
        }

        setCartItems((prev) => {
            const nextItems = prev.map((item) =>
                item.productId === productId && item.size === size
                    ? { ...item, quantity }
                    : item
            );

            const nextTotal = nextItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
            setCartTotal(nextTotal);
            return nextItems;
        });
    }

    const clearCart = async () => {
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

