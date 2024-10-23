import Order from '../models/orderModel.js';
import Cart from '../models/cartModel.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';

export const createOrder = async (req, res) => {
    const userId = req.user.id;

    try {
        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            throw new ApiError(400, "Cart is empty");
        }

        const totalAmount = cart.items.reduce((total, item) => {
            return total + (item.product.price * item.quantity);
        }, 0);

        console.log(totalAmount)

        const order = new Order({
            user: userId,
            items: cart.items,
            totalAmount
        });

        await order.save();

        // Clear the cart after creating the order
        await Cart.deleteOne({ user: userId });

        return res.status(201).json(new ApiResponse(201, order, "Order created successfully"));
    } catch (err) {
        console.error(err);
        throw new ApiError(500, "Internal server error", [err.message]);
    }
};

export const getOrderHistory = async (req, res) => {
    const userId = req.user.id;

    try {
        const orders = await Order.find({ user: userId }).populate('items.product');

        return res.status(200).json(new ApiResponse(200, orders, "Order history retrieved successfully"));
    } catch (err) {
        console.error(err);
        throw new ApiError(500, "Internal server error", [err.message]);
    }
};
