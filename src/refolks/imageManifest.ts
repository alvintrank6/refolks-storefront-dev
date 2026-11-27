const productImageFiles = {
  "the-herald": ["the-herald-01"],
  "the-curator": ["the-curator-01"],
  "the-vanguard": ["the-vanguard-01"],
  "the-navigator": ["the-navigator-01"],
  "the-weaver": [
    "the-weaver-01",
    "the-weaver-02",
    "the-weaver-03",
    "the-weaver-04",
    "the-weaver-05",
  ],
  "the-sower": [
    "the-sower-01",
    "the-sower-02",
    "the-sower-03",
    "the-sower-04",
    "the-sower-05",
  ],
  "the-trailblazer": [
    "the-trailblazer-01",
    "the-trailblazer-02",
    "the-trailblazer-03",
    "the-trailblazer-04",
    "the-trailblazer-05",
  ],
  "the-guardian": [
    "the-guardian-01",
    "the-guardian-02",
    "the-guardian-03",
    "the-guardian-04",
    "the-guardian-05",
  ],
  "the-pathfinder": [
    "the-pathfinder-01",
    "the-pathfinder-02",
    "the-pathfinder-03",
    "the-pathfinder-04",
    "the-pathfinder-05",
  ],
  "the-envoy": [
    "the-envoy-01",
    "the-envoy-02",
    "the-envoy-03",
    "the-envoy-04",
    "the-envoy-05",
  ],
  "the-storyteller": ["the-storyteller-01", "the-storyteller-02"],
} as const;

export type ProductImageId = keyof typeof productImageFiles;

export const productImages = (id: ProductImageId) =>
  productImageFiles[id].map(
    (name) => `/images/refolks/products-2026-11/${name}.webp`,
  );
