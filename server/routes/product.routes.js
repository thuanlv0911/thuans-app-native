const express = require("express");
const productController = require("../controller/product.controller");
const { authMiddleware, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", productController.getProducts);
router.get("/categories", productController.getCategories);
router.get("/:id", productController.getProductById);
router.post("/", authMiddleware, authorizeRoles("admin"), productController.createProduct);
router.put("/:id", authMiddleware, authorizeRoles("admin"), productController.updateProduct);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), productController.deleteProduct);

module.exports = router;
