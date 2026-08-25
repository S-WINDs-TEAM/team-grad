const express = require("express");
const {
  planRoute,
  getSmartDeparture,
  getTripHistory,
  getTripById,
  getAlternates,
  applyAlternateRoute,
} = require("../controllers/routeController");
const { protect } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validateMIddleware");
const {
  planRouteSchema,
  smartDepartureSchema,
} = require("../utils/validators");

const router = express.Router();

router.post("/plan", protect, validate(planRouteSchema), planRoute);
router.post(
  "/smart-departure",
  protect,
  validate(smartDepartureSchema),
  getSmartDeparture,
);
router.get("/history", protect, getTripHistory);
router.get("/:tripId", protect, getTripById);
router.get("/:tripId/alternates", protect, getAlternates);
router.post("/:tripId/apply-alternate", protect, applyAlternateRoute);
module.exports = router;
