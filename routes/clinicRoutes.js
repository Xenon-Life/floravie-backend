const express = require("express");
const clinicController = require("../controllers/clinicController");

const router = express.Router();

router.get("/health", (_req, res) => res.json({ ok: true, name: "clinics" }));
router.get("/filters", clinicController.getFilterOptions);
router.get("/", clinicController.listClinics);
router.get("/:id", clinicController.getClinic);

module.exports = router;
