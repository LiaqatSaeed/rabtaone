export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const earthKm = 6371;
  const dLat = (radiusKm / earthKm) * (180 / Math.PI);
  const dLng = (radiusKm / earthKm) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180);

  return {
    minLat: lat - dLat,
    maxLat: lat + dLat,
    minLng: lng - dLng,
    maxLng: lng + dLng,
  };
}
