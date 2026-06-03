const mongoose = require("mongoose");
const Clinic = require("../models/clinic");
const clinicsSeed = require("../data/clinicsSeed");
const {
  haversineKm,
  formatClinic,
  ALL_SPECIALTIES,
  ALL_INSURANCES,
  isClinicOpenNow,
} = require("../utils/clinicHelpers");

const dbReady = () => mongoose.connection.readyState === 1;

const loadClinicsFromDb = async () => {
  if (!dbReady()) return null;
  try {
    return await Clinic.find().lean();
  } catch (err) {
    console.error("loadClinicsFromDb error:", err);
    return null;
  }
};

const withStableIds = (clinics) =>
  clinics.map((c, i) => ({
    ...c,
    _id: c._id || `seed-${i}`,
  }));

const getClinicSource = async () => {
  const fromDb = await loadClinicsFromDb();
  if (fromDb && fromDb.length > 0) return fromDb;
  return withStableIds(clinicsSeed);
};

const matchesSearch = (clinic, q) => {
  if (!q || !q.trim()) return true;
  const terms = q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const haystack = [
    clinic.name,
    clinic.address,
    clinic.city,
    clinic.postalCode,
    clinic.province,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
};

const applyFilters = (clinics, query) => {
  const {
    q,
    city,
    postalCode,
    specialty,
    insurance,
    openNow,
    minRating,
    telehealth,
    wheelchair,
    maxDistance,
    lat,
    lng,
  } = query;

  const userLat = lat !== undefined && lat !== "" ? Number(lat) : null;
  const userLng = lng !== undefined && lng !== "" ? Number(lng) : null;
  const maxKm =
    maxDistance !== undefined && maxDistance !== ""
      ? Number(maxDistance)
      : null;
  const minRatingNum =
    minRating !== undefined && minRating !== "" ? Number(minRating) : null;

  let results = clinics.filter((c) => matchesSearch(c, q));

  if (city && city.trim()) {
    const cityTerm = city.trim().toLowerCase();
    results = results.filter((c) => c.city?.toLowerCase().includes(cityTerm));
  }

  if (postalCode && postalCode.trim()) {
    const pc = postalCode.trim().toLowerCase().replace(/\s/g, "");
    results = results.filter((c) =>
      (c.postalCode || "").toLowerCase().replace(/\s/g, "").includes(pc)
    );
  }

  if (specialty && specialty.trim()) {
    const spec = specialty.trim().toLowerCase();
    results = results.filter((c) =>
      (c.specialties || []).some((s) => s.toLowerCase() === spec)
    );
  }

  if (insurance && insurance.trim()) {
    const ins = insurance.trim().toLowerCase();
    results = results.filter((c) =>
      (c.insurancesAccepted || []).some((i) => i.toLowerCase() === ins)
    );
  }

  if (openNow === "true") {
    results = results.filter((c) => isClinicOpenNow(c.hours));
  }

  if (minRatingNum !== null && !Number.isNaN(minRatingNum)) {
    results = results.filter((c) => (c.rating || 0) >= minRatingNum);
  }

  if (telehealth === "true") {
    results = results.filter((c) => c.telehealthAvailable);
  }

  if (wheelchair === "true") {
    results = results.filter((c) => c.wheelchairAccessible);
  }

  const formatted = results.map((c) => {
    let distanceKm = null;
    if (
      userLat !== null &&
      userLng !== null &&
      !Number.isNaN(userLat) &&
      !Number.isNaN(userLng) &&
      c.lat != null &&
      c.lng != null
    ) {
      distanceKm = haversineKm(userLat, userLng, c.lat, c.lng);
    }
    return formatClinic(c, {
      distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : null,
    });
  });

  let filtered = formatted;
  if (
    maxKm !== null &&
    !Number.isNaN(maxKm) &&
    userLat !== null &&
    userLng !== null
  ) {
    filtered = formatted.filter(
      (c) => c.distanceKm !== null && c.distanceKm <= maxKm
    );
  }

  if (userLat !== null && userLng !== null && !Number.isNaN(userLat)) {
    filtered.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });
  } else {
    filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return filtered;
};

const uniqueSorted = (values) =>
  [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

exports.getFilterOptions = async (_req, res) => {
  try {
    const source = await getClinicSource();
    const fromDb = await loadClinicsFromDb();
    const specialties = uniqueSorted(
      source.flatMap((c) => c.specialties || [])
    );
    const insurances = uniqueSorted(
      source.flatMap((c) => c.insurancesAccepted || [])
    );
    const cities = uniqueSorted(source.map((c) => c.city));

    return res.status(200).json({
      specialties: specialties.length ? specialties : ALL_SPECIALTIES,
      insurances: insurances.length ? insurances : ALL_INSURANCES,
      cities,
      totalClinics: source.length,
      source: fromDb && fromDb.length > 0 ? "database" : "seed",
    });
  } catch (error) {
    console.error("getFilterOptions error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.listClinics = async (req, res) => {
  try {
    const fromDb = await loadClinicsFromDb();
    const source = await getClinicSource();
    const clinics = applyFilters(source, req.query);
    return res.status(200).json({
      clinics,
      total: clinics.length,
      source: fromDb && fromDb.length > 0 ? "database" : "seed",
    });
  } catch (error) {
    console.error("listClinics error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getClinic = async (req, res) => {
  try {
    const source = await getClinicSource();
    const id = req.params.id;

    if (dbReady() && mongoose.Types.ObjectId.isValid(id)) {
      const doc = await Clinic.findById(id).lean();
      if (doc) {
        return res.status(200).json({ clinic: formatClinic(doc) });
      }
    }

    if (String(id).startsWith("seed-")) {
      const idx = Number(String(id).replace("seed-", ""));
      const seeded = withStableIds(clinicsSeed);
      if (!Number.isNaN(idx) && idx >= 0 && idx < seeded.length) {
        return res.status(200).json({ clinic: formatClinic(seeded[idx]) });
      }
    }

    const byName = source.find(
      (c) => String(c._id) === id || c.name === id
    );
    if (byName) {
      return res.status(200).json({ clinic: formatClinic(byName) });
    }

    return res.status(404).json({ message: "Clinic not found" });
  } catch (error) {
    console.error("getClinic error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
