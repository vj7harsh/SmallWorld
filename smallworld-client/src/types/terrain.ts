export type Terrain = "forest" | "hill" | "mountain" | "plains" | "water";

export const LAND_TERRAINS: Terrain[] = ["forest", "hill", "mountain", "plains"];
export const ALL_TERRAINS: Terrain[] = [...LAND_TERRAINS, "water"];