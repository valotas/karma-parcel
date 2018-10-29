// import * as karma from "karma";
import { KarmaFile, KarmaLoggerFactory, Callback } from "./types";
import Bundler = require("parcel-bundler");
import { readFile } from "fs";
import { promisify } from "util";

// class KarmaParcelPlugin {}

function createParcelPreprocessor(logger: KarmaLoggerFactory) {
  const log = logger.create("preprocessor:parcel");

  log.info("Created parcel preprocessor");
  return (content: string, file: KarmaFile, next: Callback) => {
    const bundler = new Bundler([file.path]);
    bundler
      .bundle()
      .then(bundle => {
        log.debug(`Bundled ${file.path} to ${bundle.name}`);
        file.path = bundle.name;
        return promisify(readFile)(bundle.name);
      })
      .then(bundledContent => {
        next(null, bundledContent);
      });
  };
}

createParcelPreprocessor.$inject = ["logger"];

export = {
  //parcelPlugin: ["type", KarmaParcelPlugin],
  "preprocessor:parcel": ["factory", createParcelPreprocessor]
} as any;
