import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";

export interface IFile {
  dir: string;
  name: string;
  path: string;
  exists: () => Promise<any>;
  touch: () => Promise<any>;
  write: (str: string) => Promise<any>;
  read: () => Promise<Buffer>;
}

class TmpFile implements IFile {
  dir: string;
  name: string;
  path: string;

  private done = Promise.resolve();

  constructor(name: string) {
    this.dir = os.tmpdir();
    this.name = name;
    this.path = path.join(this.dir, this.name);
  }

  exists() {
    return promisify(fs.exists)(this.path);
  }

  async touch() {
    const exists = await this.exists();
    if (!exists) {
      return this.write("");
    }
  }

  write(content: string) {
    this.done = this.done.then(() =>
      promisify(fs.writeFile)(this.path, content)
    );
    return this.done;
  }

  read() {
    return promisify(fs.readFile)(this.path);
  }
}

export function createBundleFile(): TmpFile {
  const bundleFile = new TmpFile(`karma-parcel-${Date.now()}.js.parcel`);
  if (fs.existsSync(bundleFile.path)) {
    return bundleFile;
  }
  fs.writeFileSync(bundleFile.path, "");
  return bundleFile;
}

export class EntryFile extends TmpFile {
  private files: string[];

  constructor() {
    super(`karma-parcel-entry-${Date.now()}.js`);
    this.files = [];
  }

  add(path: string) {
    this.files.push(path);
    const content = this.files
      .map(f => `import "${this.importPath(f)}";`)
      .join("\n");
    return this.write(content);
  }

  private importPath(file: string) {
    return path.relative(this.dir, file).replace(/\\/g, "/");
  }
}
