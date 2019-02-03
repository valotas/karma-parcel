import { ParcelPlugin } from "./plugin";
import { KarmaLoggerFactory } from "./types";

export function createParcelFramework(
  logger: KarmaLoggerFactory,
  conf: any,
  parcelPlugin: ParcelPlugin
) {
  const log = logger.create("framework:parcel");

  const { bundleFile } = parcelPlugin.workspace();

  log.debug(`Adding ${bundleFile} to the fileList`);
  conf.files = conf.files || [];
  conf.files.push({
    pattern: bundleFile,
    // karma should not serve the file. Parcel's middleware will
    // do the bundling/serving of the file
    served: false,
    included: true,
    watched: parcelPlugin.isWatching()
  });

  log.debug(`Adding middleware:parcel`);
  conf.middleware = conf.middleware || [];
  if (typeof conf.middleware === "string") {
    conf.middleware = [conf.middleware];
  }
  conf.middleware.push("parcel");
}

createParcelFramework.$inject = ["logger", "config", "parcelPlugin"];
