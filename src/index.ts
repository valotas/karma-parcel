// import * as karma from "karma";
import { createParcelFramework } from "./framework";
import { createParcelPlugin } from "./plugin";
import { Callback, KarmaFile, KarmaLoggerFactory } from "./types";

function createParcelPreprocessor(logger: KarmaLoggerFactory) {
  const log = logger.create("preprocessor:parcel");

  log.info("Created parcel preprocessor");
  return (content: string, file: KarmaFile, next: Callback) => {
    next(null, `console.log("${file.path}");`);
  };
}

createParcelPreprocessor.$inject = ["logger"];

function createParcelBundlePreprocessor() {
  return (content: string, file: KarmaFile, next: Callback) => {
    next(null, content);
  };
}

export = {
  parcelPlugin: ["factory", createParcelPlugin],
  "framework:parcel": ["factory", createParcelFramework],
  "preprocessor:parcel": ["factory", createParcelPreprocessor],
  "preprocessor:parcel-bundle": ["factory", createParcelBundlePreprocessor]
} as any;
