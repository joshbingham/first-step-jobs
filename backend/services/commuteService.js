import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export async function getCommuteTime(originLat, originLon, destLat, destLon) {
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return null;
  }

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

    const element = res.data.rows?.[0]?.elements?.[0];

    if (element?.status !== "OK") return null;

    return {
      durationSeconds: element.duration.value,
      durationText: element.duration.text,
    };
  } catch (err) {
    return null;
  }
}



