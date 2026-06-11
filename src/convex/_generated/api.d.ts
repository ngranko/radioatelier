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
import type * as helpers_geocode from "../helpers/geocode.js";
import type * as helpers_importHelpers from "../helpers/importHelpers.js";
import type * as helpers_objectAggregate from "../helpers/objectAggregate.js";
import type * as helpers_objectHelpers from "../helpers/objectHelpers.js";
import type * as helpers_objectWriter from "../helpers/objectWriter.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as imports from "../imports.js";
import type * as locations from "../locations.js";
import type * as markers from "../markers.js";
import type * as migrations from "../migrations.js";
import type * as notion_client from "../notion/client.js";
import type * as notion_config from "../notion/config.js";
import type * as notion_fields from "../notion/fields.js";
import type * as notion_types from "../notion/types.js";
import type * as notion_webhooks from "../notion/webhooks.js";
import type * as notionSync_discrepancyReport from "../notionSync/discrepancyReport.js";
import type * as notionSync_discrepancyReportTypes from "../notionSync/discrepancyReportTypes.js";
import type * as notionSync_identity from "../notionSync/identity.js";
import type * as notionSync_inbound from "../notionSync/inbound.js";
import type * as notionSync_inboundDecision from "../notionSync/inboundDecision.js";
import type * as notionSync_objectWriterAdapter from "../notionSync/objectWriterAdapter.js";
import type * as notionSync_objectWriterSearch from "../notionSync/objectWriterSearch.js";
import type * as notionSync_objectWriterTypes from "../notionSync/objectWriterTypes.js";
import type * as notionSync_outbound from "../notionSync/outbound.js";
import type * as notionSync_outboundObjectSync from "../notionSync/outboundObjectSync.js";
import type * as notionSync_reconcile from "../notionSync/reconcile.js";
import type * as notionSync_snapshot from "../notionSync/snapshot.js";
import type * as notionSync_snapshotCache from "../notionSync/snapshotCache.js";
import type * as notionSync_state from "../notionSync/state.js";
import type * as notionSync_types from "../notionSync/types.js";
import type * as objects from "../objects.js";
import type * as objectsSync from "../objectsSync.js";
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
  "helpers/geocode": typeof helpers_geocode;
  "helpers/importHelpers": typeof helpers_importHelpers;
  "helpers/objectAggregate": typeof helpers_objectAggregate;
  "helpers/objectHelpers": typeof helpers_objectHelpers;
  "helpers/objectWriter": typeof helpers_objectWriter;
  http: typeof http;
  images: typeof images;
  imports: typeof imports;
  locations: typeof locations;
  markers: typeof markers;
  migrations: typeof migrations;
  "notion/client": typeof notion_client;
  "notion/config": typeof notion_config;
  "notion/fields": typeof notion_fields;
  "notion/types": typeof notion_types;
  "notion/webhooks": typeof notion_webhooks;
  "notionSync/discrepancyReport": typeof notionSync_discrepancyReport;
  "notionSync/discrepancyReportTypes": typeof notionSync_discrepancyReportTypes;
  "notionSync/identity": typeof notionSync_identity;
  "notionSync/inbound": typeof notionSync_inbound;
  "notionSync/inboundDecision": typeof notionSync_inboundDecision;
  "notionSync/objectWriterAdapter": typeof notionSync_objectWriterAdapter;
  "notionSync/objectWriterSearch": typeof notionSync_objectWriterSearch;
  "notionSync/objectWriterTypes": typeof notionSync_objectWriterTypes;
  "notionSync/outbound": typeof notionSync_outbound;
  "notionSync/outboundObjectSync": typeof notionSync_outboundObjectSync;
  "notionSync/reconcile": typeof notionSync_reconcile;
  "notionSync/snapshot": typeof notionSync_snapshot;
  "notionSync/snapshotCache": typeof notionSync_snapshotCache;
  "notionSync/state": typeof notionSync_state;
  "notionSync/types": typeof notionSync_types;
  objects: typeof objects;
  objectsSync: typeof objectsSync;
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

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
          oneBatchOnly?: boolean;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
};
