/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as assignments from "../assignments.js";
import type * as courses from "../courses.js";
import type * as enrollments from "../enrollments.js";
import type * as grades from "../grades.js";
import type * as http from "../http.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_progress from "../lib/progress.js";
import type * as lib_submissions from "../lib/submissions.js";
import type * as progress from "../progress.js";
import type * as submissions from "../submissions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  assignments: typeof assignments;
  courses: typeof courses;
  enrollments: typeof enrollments;
  grades: typeof grades;
  http: typeof http;
  "lib/access": typeof lib_access;
  "lib/auth": typeof lib_auth;
  "lib/progress": typeof lib_progress;
  "lib/submissions": typeof lib_submissions;
  progress: typeof progress;
  submissions: typeof submissions;
  users: typeof users;
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
