import { Euler, Matrix4, Vector3 } from "three";
import { normalizeCloud, PointCloudBuilder, type PointCloud, type Vec3 } from "./builder";
import * as catalog from "./catalog";
import { createRng, hashString } from "./random";

/** Every predefined form the organism can take. `self` is its own idle body. */
export const SHAPE_IDS = [
  "banana",
  "potato",
  "duck",
  "cat",
  "fish",
  "car",
  "shoe",
  "chair",
  "cup",
  "pizza",
  "heart",
  "tree",
  "robot",
  "planet",
  "mug",
] as const;

export type ObjectShapeId = (typeof SHAPE_IDS)[number];
export type ShapeId = ObjectShapeId | "self";

export interface ShapeDefinition {
  id: ShapeId;
  label: string;
  /** Words people use for this form; matched case-insensitively as whole words. */
  aliases: string[];
  recipe: catalog.ShapeRecipe;
  /** Presentation rotation applied after sampling (radians, XYZ). */
  tilt?: Vec3;
  /** Radius of the farthest particle after normalization; omit to keep native units. */
  radius?: number;
}

const OBJECT_RADIUS = 1.5;

export const SHAPES: Record<ShapeId, ShapeDefinition> = {
  self: { id: "self", label: "myself", aliases: [], recipe: catalog.entity },
  banana: {
    id: "banana",
    label: "banana",
    aliases: ["banana", "bananas", "plantain"],
    recipe: catalog.banana,
    tilt: [0.35, 0.3, -0.12],
  },
  potato: { id: "potato", label: "potato", aliases: ["potato", "potatoes", "spud", "tater", "yam"], recipe: catalog.potato },
  duck: {
    id: "duck",
    label: "duck",
    aliases: ["duck", "ducky", "duckling", "rubber duck", "rubber ducky", "goose"],
    recipe: catalog.duck,
    tilt: [0, -0.5, 0],
  },
  cat: { id: "cat", label: "cat", aliases: ["cat", "kitty", "kitten", "kitteh", "feline", "pussycat"], recipe: catalog.cat },
  fish: {
    id: "fish",
    label: "fish",
    aliases: ["fish", "goldfish", "salmon", "trout", "tuna", "cod", "carp", "koi"],
    recipe: catalog.fish,
    tilt: [0, -0.35, 0],
  },
  car: {
    id: "car",
    label: "car",
    aliases: ["car", "ferrari", "lamborghini", "porsche", "sports car", "supercar", "race car", "racecar", "automobile", "vehicle", "tesla"],
    recipe: catalog.car,
    tilt: [0.12, -0.6, 0],
  },
  shoe: {
    id: "shoe",
    label: "shoe",
    aliases: ["shoe", "shoes", "sneaker", "sneakers", "trainer", "trainers", "boot", "footwear"],
    recipe: catalog.shoe,
    tilt: [0.15, -0.5, 0],
  },
  chair: { id: "chair", label: "chair", aliases: ["chair", "chairs", "seat", "stool"], recipe: catalog.chair, tilt: [0.12, 0.6, 0] },
  cup: {
    id: "cup",
    label: "cup",
    aliases: ["cup", "teacup", "tea cup", "cup of tea", "tea"],
    recipe: catalog.cup,
    tilt: [0.32, 0, 0],
  },
  pizza: {
    id: "pizza",
    label: "pizza",
    aliases: ["pizza", "pizzas", "pepperoni pizza", "margherita"],
    recipe: catalog.pizza,
    tilt: [0.95, 0, 0],
  },
  heart: { id: "heart", label: "heart", aliases: ["heart", "love", "love heart"], recipe: catalog.heart },
  tree: { id: "tree", label: "tree", aliases: ["tree", "trees", "oak", "oak tree", "plant"], recipe: catalog.tree },
  robot: {
    id: "robot",
    label: "robot",
    aliases: ["robot", "robots", "bot", "android", "droid", "cyborg", "machine"],
    recipe: catalog.robot,
  },
  planet: {
    id: "planet",
    label: "planet",
    aliases: ["planet", "saturn", "jupiter", "earth", "world", "globe", "gas giant", "mars", "neptune"],
    recipe: catalog.planet,
    tilt: [0.32, 0, 0.38],
  },
  mug: {
    id: "mug",
    label: "coffee mug",
    aliases: ["coffee mug", "mug", "mugs", "coffee cup", "coffee", "latte", "cappuccino", "espresso"],
    recipe: catalog.mug,
    tilt: [0.28, 0, 0],
  },
};

export function isShapeId(value: unknown): value is ShapeId {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(SHAPES, value);
}

export function isObjectShapeId(value: unknown): value is ObjectShapeId {
  return typeof value === "string" && (SHAPE_IDS as readonly string[]).includes(value);
}

/**
 * Anything the morph engine can become. Today every source is a built-in recipe; a future
 * generator (text-to-3D, a mesh upload) only has to produce a `PointCloud` of the same size.
 */
export type ShapeSource = { kind: "builtin"; id: ShapeId } | { kind: "points"; key: string; cloud: PointCloud };

/** Sample a shape into exactly `count` particles. Deterministic per (id, count). */
export function generateShape(id: ShapeId, count: number): PointCloud {
  const def = SHAPES[id];
  const builder = new PointCloudBuilder();
  def.recipe(builder, createRng(hashString(id)));
  const cloud = builder.build(count, createRng(hashString(`${id}:${count}`)));
  if (def.tilt) rotateCloud(cloud, def.tilt);
  return id === "self" ? cloud : normalizeCloud(cloud, def.radius ?? OBJECT_RADIUS);
}

function rotateCloud(cloud: PointCloud, [x, y, z]: Vec3) {
  const m = new Matrix4().makeRotationFromEuler(new Euler(x, y, z));
  const v = new Vector3();
  for (let i = 0; i < cloud.count; i++) {
    v.fromArray(cloud.positions, i * 3).applyMatrix4(m);
    v.toArray(cloud.positions, i * 3);
  }
}

const cache = new Map<string, PointCloud>();

/** Cached variant used at runtime; the engine never mutates returned clouds. */
export function getShape(id: ShapeId, count: number): PointCloud {
  const key = `${id}:${count}`;
  let cloud = cache.get(key);
  if (!cloud) {
    cloud = generateShape(id, count);
    cache.set(key, cloud);
  }
  return cloud;
}
