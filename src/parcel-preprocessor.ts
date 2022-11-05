import { KarmaConf, ParcelPlugin } from "./plugin";
import type { Callback, KarmaFile, KarmaLoggerFactory } from "./types";

export function parcelPreprocessor(
  parcelPlugin: ParcelPlugin,
  logger: KarmaLoggerFactory,
  conf: KarmaConf
) {
  const log = logger.create("preprocessor:parcel");

  return function (_: string, file: KarmaFile, next: Callback) {
    log.debug(`Adding ${file.originalPath}`);

    parcelPlugin.addFile(file).then(() => {
      if (conf.logLevel === conf.LOG_DEBUG) {
        next(null, `console.log("${file.path}");`);
      } else {
        next(null, `/* ${file.path} */`);
      }
    });
  };
}

parcelPreprocessor.$inject = ["parcelPlugin", "logger", "config"];
