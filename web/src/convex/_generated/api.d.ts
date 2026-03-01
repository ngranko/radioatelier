/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories from "../categories.js";
import type * as helpers_objectHelpers from "../helpers/objectHelpers.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as locations from "../locations.js";
import type * as markers from "../markers.js";
import type * as migrations from "../migrations.js";
import type * as objects from "../objects.js";
import type * as privateTags from "../privateTags.js";
import type * as sharedValidators from "../sharedValidators.js";
import type * as tags from "../tags.js";
import type * as users from "../users.js";
import type * as utils_visitedChunks from "../utils/visitedChunks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  "helpers/objectHelpers": typeof helpers_objectHelpers;
  http: typeof http;
  images: typeof images;
  locations: typeof locations;
  markers: typeof markers;
  migrations: typeof migrations;
  objects: typeof objects;
  privateTags: typeof privateTags;
  sharedValidators: typeof sharedValidators;
  tags: typeof tags;
  users: typeof users;
  "utils/visitedChunks": typeof utils_visitedChunks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
