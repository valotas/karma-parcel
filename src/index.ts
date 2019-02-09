import { createParcelFramework } from "./framework";
import { createParcelPlugin, ParcelPlugin } from "./plugin";

function createParcelPreprocessor(parcePlugin: ParcelPlugin) {
  return parcePlugin.preprocessor;
}

createParcelPreprocessor.$inject = ["parcelPlugin"];

function createParcelMiddleware(parcePlugin: ParcelPlugin) {
  return parcePlugin.middleware;
}

createParcelMiddleware.$inject = ["parcelPlugin"];

export = {
  parcelPlugin: ["factory", createParcelPlugin],
  "framework:parcel": ["factory", createParcelFramework],
  "preprocessor:parcel": ["factory", createParcelPreprocessor],
  "middleware:parcel": ["factory", createParcelMiddleware]
} as any;
