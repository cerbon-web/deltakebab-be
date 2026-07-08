import { prisma } from '../database/prisma';

export const getRestaurants = async () => {
  return prisma.restaurant.findMany({
    include: {
      info: true,
      branches: {
        where: { active: true },
        include: {
          hours: true,
          deliveryRules: true
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
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
      branches: {
        where: { active: true },
        include: {
          hours: true,
          deliveryRules: true
        }
      }
    }
  });

  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const withDistances = restaurants.map((restaurant) => {
    const branches = (restaurant.branches || []).map((branch: any) => {
      const branchLat = branch.latitude !== null && branch.latitude !== undefined ? Number(branch.latitude) : null;
      const branchLng = branch.longitude !== null && branch.longitude !== undefined ? Number(branch.longitude) : null;
      const distance_km = branchLat !== null && branchLng !== null ? haversine(latitude, longitude, branchLat, branchLng) : null;
      return { ...branch, distance_km };
    });

    const valid = branches.map((branch: any) => branch.distance_km).filter((distance: any) => distance !== null && distance !== undefined);
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
      branches: {
        where: { active: true },
        include: {
          hours: true,
          deliveryRules: true
        },
        orderBy: { name: 'asc' }
      }
    }
  });
};
