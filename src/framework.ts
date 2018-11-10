import { KarmaLoggerFactory } from "./types";
import { ParcelPlugin } from "./plugin";

export function createParcelFramework(
  logger: KarmaLoggerFactory,
  conf: any,
  parcelPlugin: ParcelPlugin
) {
  const log = logger.create("framework:parcel");

  if (!conf.parcelFiles) {
    log.info("No parcelFiles defined in config");
    return;
  }

  log.debug(`Creating parcel bundle with files`, conf.parcelFiles);

  conf.files = (conf.files || []).push(parcelPlugin.getBundlePath());
  conf.preprocessors = Object.assign(conf.preprocessors || {}, {
    "**/*.parcel": "parcel-bundle"
  });
}

createParcelFramework.$inject = ["logger", "config", "parcelPlugin"];
