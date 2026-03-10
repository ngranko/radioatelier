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
import type * as crons from "../crons.js";
import type * as helpers_importHelpers from "../helpers/importHelpers.js";
import type * as helpers_objectHelpers from "../helpers/objectHelpers.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as imports from "../imports.js";
import type * as importsNode from "../importsNode.js";
import type * as locations from "../locations.js";
import type * as markers from "../markers.js";
import type * as migrations from "../migrations.js";
import type * as objects from "../objects.js";
import type * as privateTags from "../privateTags.js";
import type * as search from "../search.js";
import type * as search_googlePlaces from "../search/googlePlaces.js";
import type * as sharedValidators from "../sharedValidators.js";
import type * as storage from "../storage.js";
import type * as tags from "../tags.js";
import type * as typesense from "../typesense.js";
import type * as typesense_client from "../typesense/client.js";
import type * as typesense_objects from "../typesense/objects.js";
import type * as users from "../users.js";
import type * as utils_googleAddress from "../utils/googleAddress.js";
import type * as utils_visitedChunks from "../utils/visitedChunks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  categories: typeof categories;
  crons: typeof crons;
  "helpers/importHelpers": typeof helpers_importHelpers;
  "helpers/objectHelpers": typeof helpers_objectHelpers;
  http: typeof http;
  images: typeof images;
  imports: typeof imports;
  importsNode: typeof importsNode;
  locations: typeof locations;
  markers: typeof markers;
  migrations: typeof migrations;
  objects: typeof objects;
  privateTags: typeof privateTags;
  search: typeof search;
  "search/googlePlaces": typeof search_googlePlaces;
  sharedValidators: typeof sharedValidators;
  storage: typeof storage;
  tags: typeof tags;
  typesense: typeof typesense;
  "typesense/client": typeof typesense_client;
  "typesense/objects": typeof typesense_objects;
  users: typeof users;
  "utils/googleAddress": typeof utils_googleAddress;
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
