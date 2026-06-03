const mongoose = require("mongoose");

const dayHoursSchema = new mongoose.Schema(
  {
    open: { type: String, default: null },
    close: { type: String, default: null },
  },
  { _id: false }
);

const clinicSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true, index: true },
  province: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true, index: true },
  phone: { type: String, required: true, trim: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  specialties: [{ type: String, trim: true }],
  insurancesAccepted: [{ type: String, trim: true }],
  rating: { type: Number, min: 0, max: 5, default: 0 },
  telehealthAvailable: { type: Boolean, default: false },
  wheelchairAccessible: { type: Boolean, default: false },
  hoursSummary: { type: String, default: "" },
  hours: {
    monday: { type: dayHoursSchema, default: null },
    tuesday: { type: dayHoursSchema, default: null },
    wednesday: { type: dayHoursSchema, default: null },
    thursday: { type: dayHoursSchema, default: null },
    friday: { type: dayHoursSchema, default: null },
    saturday: { type: dayHoursSchema, default: null },
    sunday: { type: dayHoursSchema, default: null },
  },
});

clinicSchema.index({ lat: 1, lng: 1 });

const Clinic = mongoose.model("Clinic", clinicSchema);

module.exports = Clinic;
