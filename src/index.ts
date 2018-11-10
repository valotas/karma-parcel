import { createParcelFramework } from "./framework";
import { createParcelPlugin, ParcelPlugin } from "./plugin";
import { Callback, KarmaFile, KarmaLoggerFactory } from "./types";

function createParcelPreprocessor(
  logger: KarmaLoggerFactory,
  parcePlugin: ParcelPlugin
) {
  const log = logger.create("preprocessor:parcel");

  return (content: string, file: KarmaFile, next: Callback) => {
    log.debug(`Adding ${file.originalPath} to bundle`);

    parcePlugin.addFile(file).then(() => {
      next(null, `console.log("${file.path}");`);
    });
  };
}

createParcelPreprocessor.$inject = ["logger", "parcelPlugin"];

function createParcelBundlePreprocessor(parcePlugin: ParcelPlugin) {
  return (content: string, file: KarmaFile, next: Callback) => {
    parcePlugin
      .bundle()
      .then(file => file.read())
      .then(content => next(null, content));
  };
}

createParcelBundlePreprocessor.$inject = ["parcelPlugin"];

export = {
  parcelPlugin: ["factory", createParcelPlugin],
  "framework:parcel": ["factory", createParcelFramework],
  "preprocessor:parcel": ["factory", createParcelPreprocessor],
  "preprocessor:parcel-bundle": ["factory", createParcelBundlePreprocessor]
} as any;
