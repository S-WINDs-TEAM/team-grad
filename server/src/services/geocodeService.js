const axios = require("axios");

const searchLocation = async (query) => {
  const response = await axios.get(
    "https://nominatim.openstreetmap.org/search",
    {
      params: {
        q: query,
        format: "json",
        limit: 5,
        // BUG FIX: Nominatim's query parameter is "countrycodes" (lowercase).
        // The original "countryCodes" was silently ignored, so search returned
        // worldwide results instead of being scoped to Egypt.
        countrycodes: "eg",
      },
      headers: {
        "User-Agent": "S-WINDs-App/1.0",
      },
    },
  );
  return response.data.map((place) => ({
    displayName: place.display_name,
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
  }));
};
module.exports = { searchLocation };
