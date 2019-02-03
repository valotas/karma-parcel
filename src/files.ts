import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import * as mkdirp from "mkdirp";
import rimraf = require("rimraf");

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

  constructor(dir: string, name: string) {
    this.dir = dir;
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
  const bundleFile = new TmpFile(
    os.tmpdir(),
    `karma-parcel-${Date.now()}.js.parcel`
  );
  if (fs.existsSync(bundleFile.path)) {
    return bundleFile;
  }
  fs.writeFileSync(bundleFile.path, "");
  return bundleFile;
}

export class EntryFile extends TmpFile {
  private files: string[];

  constructor(dir: string) {
    super(dir, "entry.js");
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
    const relativePath = path.relative(this.dir, file).replace(/\\/g, "/");
    if (relativePath.indexOf(".") !== 0) {
      return `./${relativePath}`;
    }
    return relativePath;
  }

  toString() {
    return `EntryFile(${this.path}, imports: ${this.files.length})`;
  }
}

class Workspace {
  dir: string;
  bundleFile: string;
  entryFile: EntryFile;

  constructor(dir: string) {
    this.dir = dir;
    this.bundleFile = path.join(dir, "index.js");
    this.entryFile = new EntryFile(dir);
  }

  toString() {
    return "Workspace()";
  }
}

export function createWorkspaceSync() {
  const dir = path.join(process.cwd(), ".karma-parcel");
  rimraf.sync(dir);

  const workspace = new Workspace(dir);

  mkdirp.sync(workspace.dir);
  fs.writeFileSync(workspace.bundleFile, "");

  return workspace;
}
