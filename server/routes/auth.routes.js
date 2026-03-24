const express = require("express");
const authController = require("../controller/auth.controller");
const { authMiddleware } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.getMe);
router.put("/me", authMiddleware, authController.updateMe);

module.exports = router;
