import * as os from "os";
import * as path from "path";
import { BundleFile, EntryFile } from "./files";
import { KarmaFile, KarmaLoggerFactory, Logger } from "./types";
import Bundler = require("parcel-bundler");

export class ParcelPlugin {
  private log: Logger;
  private entry: EntryFile;
  private bundleFile: BundleFile;

  constructor(logger: Logger) {
    this.log = logger;
    this.entry = new EntryFile();
    this.bundleFile = new BundleFile();
  }

  addFile(file: KarmaFile) {
    this.log.debug("Adding to the parcel bundle:", file.originalPath);
    return this.entry.add(file.originalPath);
  }

  bundle() {
    const bundler = new Bundler([this.entry.path], {
      outDir: this.bundleFile.dir,
      outFile: this.bundleFile.name,
      cacheDir: path.join(os.tmpdir(), "karma-parcel-cache"),
      watch: false,
      detailedReport: false,
      logLevel: 1
    });
    return bundler.bundle().then(() => this.bundleFile);
  }
}

export function createParcelPlugin(logger: KarmaLoggerFactory) {
  return new ParcelPlugin(logger.create("parcel"));
}

createParcelPlugin.$inject = ["logger"];
