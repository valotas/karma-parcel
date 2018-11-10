import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";

class TmpFile {
  dir: string;
  name: string;

  path: string;

  constructor(name: string) {
    this.dir = os.tmpdir();
    this.name = name;
    this.path = path.join(this.dir, this.name);
  }

  exists() {
    return promisify(fs.exists)(this.path);
  }
}

export class BundleFile extends TmpFile {
  constructor() {
    super(`karma-parcel-${Date.now()}.js.parcel`);
  }
}

export class EntryFile extends TmpFile {
  private files: string[];
  private done = Promise.resolve();

  constructor() {
    super(`karma-parcel-entry-${Date.now()}.js`);
    this.files = [];
  }

  add(path: string) {
    this.files.push(path);
    const content = this.files.map(f => `import "..${f}";`).join("\n");
    return this.write(content);
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
}
