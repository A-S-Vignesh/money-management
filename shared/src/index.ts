// @money-nest/shared
// Validation schemas + cross-platform types shared between the Next.js web
// app and the React Native mobile app.
//
// Source of truth for: request bodies, response shapes, category lists.
// Keep ONLY pure code in here (no React, no Mongoose, no DOM/RN imports).

export * from "./validations/transaction";
export * from "./validations/budget";
export * from "./validations/goal";
export * from "./categories";
export * from "./types/api";
