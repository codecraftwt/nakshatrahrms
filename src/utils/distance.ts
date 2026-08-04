export const getDistanceInMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6_371_000; // Earth radius in metres
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const sinHalfLat = Math.sin(dLat / 2);
  const sinHalfLon = Math.sin(dLon / 2);
  const h =
    sinHalfLat * sinHalfLat +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sinHalfLon * sinHalfLon;
  return 2 * R * Math.asin(Math.sqrt(h));
};
