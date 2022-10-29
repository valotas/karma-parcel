import { createParcelFramework } from "./framework";
import { ParcelPlugin } from "./plugin";

export = {
  parcelPlugin: ["factory", ParcelPlugin.factory],
  "framework:parcel": ["factory", createParcelFramework],
  "preprocessor:parcel": [
    "factory",
    function createParcelPreprocessor(parcelPlugin: ParcelPlugin) {
      return parcelPlugin.preprocessor;
    },
  ],
  "middleware:parcel": [
    "factory",
    function createParcelMiddleware(parcelPlugin: ParcelPlugin) {
      return parcelPlugin.middleware;
    },
  ],
} as any;
