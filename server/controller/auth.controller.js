const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const signToken = (user) => {
    const jwtSecret = process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-jwt-secret";

    return jwt.sign(
        {
            sub: String(user._id),
            email: user.email,
            role: user.role,
            name: user.name,
        },
        jwtSecret,
        { expiresIn: "7d" }
    );
};

const sanitizeUser = (user) => ({
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
});

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const user = await User.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password,
        });

        const safeUser = sanitizeUser(user);
        const token = signToken(user);

        return res.status(201).json({
            message: "Register successfully",
            token,
            user: safeUser,
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to register user" });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const safeUser = sanitizeUser(user);
        const token = signToken(user);

        return res.json({
            message: "Login successfully",
            token,
            user: safeUser,
        });
    } catch (error) {
        return res.status(500).json({ message: "Unable to login" });
    }
};

const getMe = async (req, res) => {
    return res.json({ user: sanitizeUser(req.user) });
};

const updateMe = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Name is required" });
        }

        const trimmedName = name.trim();
        req.user.name = trimmedName;
        await req.user.save();

        return res.json({ user: sanitizeUser(req.user) });
    } catch (error) {
        return res.status(500).json({ message: "Unable to update profile" });
    }
};

module.exports = {
    register,
    login,
    getMe,
    updateMe,
};