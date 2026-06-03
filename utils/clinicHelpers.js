const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const isClinicOpenNow = (hours, date = new Date()) => {
  if (!hours) return false;
  const dayKey = DAY_KEYS[date.getDay()];
  const slot = hours[dayKey];
  if (!slot || !slot.open || !slot.close) return false;

  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  const openMinutes = parseTimeToMinutes(slot.open);
  const closeMinutes = parseTimeToMinutes(slot.close);
  if (openMinutes === null || closeMinutes === null) return false;

  return nowMinutes >= openMinutes && nowMinutes < closeMinutes;
};

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatClinic = (clinic, extra = {}) => {
  const doc = clinic.toObject ? clinic.toObject() : { ...clinic };
  const openNow = isClinicOpenNow(doc.hours);
  return {
    _id: doc._id,
    name: doc.name,
    address: doc.address,
    city: doc.city,
    province: doc.province,
    postalCode: doc.postalCode,
    phone: doc.phone,
    lat: doc.lat,
    lng: doc.lng,
    specialties: doc.specialties || [],
    insurancesAccepted: doc.insurancesAccepted || [],
    rating: doc.rating,
    telehealthAvailable: !!doc.telehealthAvailable,
    wheelchairAccessible: !!doc.wheelchairAccessible,
    hoursSummary: doc.hoursSummary || "",
    hours: doc.hours,
    openNow,
    ...extra,
  };
};

const ALL_SPECIALTIES = [
  "Women's Health",
  "OB/GYN",
  "Pediatrics",
  "Mental Health",
  "Dental",
  "Cardiology",
  "Family Medicine",
];

const ALL_INSURANCES = [
  "OHIP",
  "MSP",
  "RAMQ",
  "AHCIP",
  "Sun Life",
  "Manulife",
  "Blue Cross",
  "Pacific Blue Cross",
  "Green Shield",
];

module.exports = {
  DAY_KEYS,
  isClinicOpenNow,
  haversineKm,
  formatClinic,
  ALL_SPECIALTIES,
  ALL_INSURANCES,
};
