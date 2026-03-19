const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization || "";
        const [scheme, token] = authorization.split(" ");
        const jwtSecret = process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-jwt-secret";

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({ message: "Missing or invalid authorization header" });
        }

        const payload = jwt.verify(token, jwtSecret);
        const user = await User.findById(payload.sub).select("-password");

        if (!user) {
            return res.status(401).json({ message: "User no longer exists" });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "You do not have permission to access this resource" });
    }

    return next();
};

module.exports = {
    authMiddleware,
    authorizeRoles,
};
