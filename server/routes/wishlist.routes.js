const express = require("express");
const wishlistController = require("../controller/wishlist.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", authMiddleware, wishlistController.getWishlist);
router.post("/toggle", authMiddleware, wishlistController.toggleWishlist);

module.exports = router;
