import * as os from "os";
import * as path from "path";
import { BundleFile, EntryFile } from "./files";
import { KarmaFile, KarmaLoggerFactory, Logger } from "./types";
import Bundler = require("parcel-bundler");

export class ParcelPlugin {
  private log: Logger;
  private entry: EntryFile;
  private bundleFile: BundleFile | null;

  constructor(logger: Logger) {
    this.log = logger;
    this.entry = new EntryFile();
    this.bundleFile = null;
  }

  addFile(file: KarmaFile | string) {
    const path = (file as any).originalPath || file;
    this.log.debug("Adding to the parcel bundle:", path);
    return this.entry.add(path);
  }

  setBundleFile(file: BundleFile) {
    this.bundleFile = file;
  }

  bundle(): Promise<BundleFile> {
    if (!this.bundleFile) {
      throw new Error(
        "No target bundle file. Make sure you call 'setBundleFile' before 'bundle'"
      );
    }

    const bundler = new Bundler([this.entry.path], {
      outDir: this.bundleFile.dir,
      outFile: this.bundleFile.name,
      cacheDir: path.join(os.tmpdir(), "karma-parcel-cache"),
      watch: false,
      detailedReport: false,
      logLevel: 1
    });
    return bundler.bundle().then(() => this.bundleFile as BundleFile);
  }
}

export function createParcelPlugin(logger: KarmaLoggerFactory) {
  return new ParcelPlugin(logger.create("parcel"));
}

createParcelPlugin.$inject = ["logger"];
