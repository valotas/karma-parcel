import * as os from "os";
import * as path from "path";
import { EntryFile, IFile } from "./files";
import { KarmaFile, KarmaLoggerFactory, Logger } from "./types";
import Bundler = require("parcel-bundler");
import { bundle } from "./bunlder";
import karma = require("karma");

export class ParcelPlugin {
  private log: Logger;
  private entry: EntryFile;
  private bundleFile: IFile | null;
  private karmaConf: karma.ConfigOptions;
  private bundlePromise: Promise<Bundler.ParcelBundle> | null;

  constructor(logger: Logger, conf: karma.ConfigOptions) {
    this.log = logger;
    this.entry = new EntryFile();
    this.bundleFile = null;
    this.karmaConf = conf;
    this.bundlePromise = null;
  }

  addFile(file: KarmaFile | string) {
    const path = (file as any).originalPath || file;
    this.log.debug("Adding to the parcel bundle:", path);
    return this.entry.add(path);
  }

  setBundleFile(file: IFile) {
    this.bundleFile = file;
  }

  bundle(): Promise<IFile> {
    this.bundlePromise = this.bundlePromise || this.createBundlerAndBundle({});
    return this.bundlePromise.then(() => this.bundleFile as IFile);
  }

  private createBundlerAndBundle(options: Bundler.ParcelOptions) {
    if (!this.bundleFile) {
      throw new Error(
        "No target bundle file. Make sure you call 'setBundleFile' before 'bundle'"
      );
    }
    return bundle(this.entry.path, {
      outDir: this.bundleFile.dir,
      outFile: this.bundleFile.name,
      cacheDir: path.join(os.tmpdir(), "karma-parcel-cache"),
      watch: this.karmaConf.autoWatch || false,
      detailedReport: false,
      logLevel: 1
    });
  }
}

export function createParcelPlugin(
  logger: KarmaLoggerFactory,
  config: karma.ConfigOptions
) {
  return new ParcelPlugin(logger.create("parcel"), config);
}

createParcelPlugin.$inject = ["logger", "config"];
