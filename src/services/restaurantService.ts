import { prisma } from '../database/prisma';

export const getRestaurants = async () => {
  return prisma.restaurant.findMany({
    include: {
      info: true,
      hours: true,
      deliveryRules: true,
      branches: true
    }
  });
};

export const getNearestRestaurants = async (lat: string, lng: string) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return [];
  }

  const restaurants = await prisma.restaurant.findMany({
    include: {
      info: true,
      hours: true,
      deliveryRules: true,
      branches: true
    }
  });

  // Haversine formula to compute distance in kilometers
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const withDistances = restaurants.map((restaurant) => {
    const branches = (restaurant.branches || []).map((b: any) => {
      const bl = b.latitude !== null && b.latitude !== undefined ? Number(b.latitude) : null;
      const br = b.longitude !== null && b.longitude !== undefined ? Number(b.longitude) : null;
      const distance_km = (bl !== null && br !== null) ? haversine(latitude, longitude, bl, br) : null;
      return { ...b, distance_km };
    });

    const valid = branches.map((b: any) => b.distance_km).filter((d: any) => d !== null && d !== undefined);
    const min = valid.length > 0 ? Math.min(...valid) : null;

    return {
      ...restaurant,
      branches,
      distance_km: min
    };
  });

  withDistances.sort((a, b) => {
    if (a.distance_km === null && b.distance_km === null) return 0;
    if (a.distance_km === null) return 1;
    if (b.distance_km === null) return -1;
    return a.distance_km - b.distance_km;
  });

  return withDistances;
};

export const getRestaurantById = async (id: string) => {
  return prisma.restaurant.findUnique({
    where: { id },
    include: {
      info: true,
      hours: true,
      deliveryRules: true,
      branches: true
    }
  });
};
