import * as fs from "fs";
import * as path from "path";
import { promisify } from "util";
import * as mkdirp from "mkdirp";
import rimraf = require("rimraf");

export interface IFile {
  dir: string;
  name: string;
  path: string;
  write: (str: string) => Promise<any>;
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

  write(content: string) {
    this.done = this.done.then(() =>
      promisify(fs.writeFile)(this.path, content)
    );
    return this.done;
  }
}

const bundleTestsFilename = "__parcel_bundled_tests.js";

export class EntryFile extends TmpFile {
  private files: string[];

  constructor(dir: string) {
    super(dir, bundleTestsFilename);
    this.files = [];
  }

  add(path: string) {
    if (this.files.indexOf(path) === -1) {
      this.files.push(path);
    }

    const content = this.files
      .map((f) => `import "${this.importPath(f)}";`)
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
  distDir: string;
  entryFile: EntryFile;

  constructor(dir: string) {
    this.dir = dir;
    this.entryFile = new EntryFile(dir);
    this.distDir = path.join(dir, "dist");
    this.bundleFile = path.join(this.distDir, bundleTestsFilename);
  }

  toString() {
    return "Workspace()";
  }
}

export function createWorkspaceSync(basePath?: string): Workspace {
  basePath = basePath || process.cwd();
  const dir = path.join(basePath, ".karma-parcel");
  rimraf.sync(dir);

  const workspace = new Workspace(dir);

  mkdirp.sync(workspace.dir);
  mkdirp.sync(workspace.distDir);
  fs.writeFileSync(workspace.bundleFile, "");

  return workspace;
}
