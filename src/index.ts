import { ConfigOptions } from "karma";
import { createParcelFramework } from "./framework";
import { createParcelPlugin, ParcelPlugin } from "./plugin";
import { Callback, KarmaFile, KarmaLoggerFactory } from "./types";

function createParcelPreprocessor(
  logger: KarmaLoggerFactory,
  parcePlugin: ParcelPlugin,
  config: ConfigOptions
) {
  const log = logger.create("preprocessor:parcel");

  return (content: string, file: KarmaFile, next: Callback) => {
    log.debug(`Adding ${file.originalPath} to bundle`);

    parcePlugin.addFile(file).then(() => {
      if (config.logLevel === (config as any).LOG_DEBUG) {
        next(null, `console.log("${file.path}");`);
      } else {
        next(null, `/* ${file.path} */`);
      }
    });
  };
}

createParcelPreprocessor.$inject = ["logger", "parcelPlugin", "config"];

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
