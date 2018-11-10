import * as glob from "glob";
import { KarmaLoggerFactory } from "./types";
import { ParcelPlugin } from "./plugin";
import { promisify } from "util";
import { BundleFile } from "./files";

export function createParcelFramework(
  logger: KarmaLoggerFactory,
  conf: any,
  parcelPlugin: ParcelPlugin
) {
  const log = logger.create("framework:parcel");

  log.debug("Adding preprocessor for **/*.parcel");
  conf.preprocessors = Object.assign(conf.preprocessors || {}, {
    "**/*.parcel": ["parcel-bundle"]
  });

  const bundleFile = new BundleFile();
  bundleFile.touchSync();

  log.debug(`Adding ${bundleFile.path} to the fileList`);
  conf.files = conf.files || [];
  conf.files.push({
    pattern: bundleFile.path,
    served: true,
    included: true,
    watched: true
  });

  parcelPlugin.setBundleFile(bundleFile);
}

createParcelFramework.$inject = ["logger", "config", "parcelPlugin"];
