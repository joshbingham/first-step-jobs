import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function getCommuteTime(originLat, originLon, destLat, destLon) {
  console.log("🔑 API KEY EXISTS:", !!process.env.GOOGLE_MAPS_API_KEY);

  try {
    const url = "https://maps.googleapis.com/maps/api/distancematrix/json";

    const res = await axios.get(url, {
      params: {
        origins: `${originLat},${originLon}`,
        destinations: `${destLat},${destLon}`,
        key: process.env.GOOGLE_MAPS_API_KEY,
        mode: "driving",
      },
    });

    console.log("📦 Google response:", res.data);

    const element = res.data.rows?.[0]?.elements?.[0];

    console.log("📍 element:", element);

    if (!element || element.status !== "OK") return null;

    return {
      durationSeconds: element.duration.value,
      durationText: element.duration.text,
    };
  } catch (err) {
    console.log("❌ Google API error:", err.response?.data || err.message);
    return null;
  }
}



