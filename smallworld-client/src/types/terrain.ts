export type Terrain = "forest" | "hill" | "mountain" | "plains" | "water" | "swamp" | "abyss";

export const LAND_TERRAINS: Terrain[] = ["forest", "hill", "mountain", "plains", "swamp", "abyss"];
export const ALL_TERRAINS: Terrain[] = [...LAND_TERRAINS, "water"];