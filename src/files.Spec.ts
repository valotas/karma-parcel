// eslint-env mocha
import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as sinon from "sinon";
import { promisify } from "util";
import { createBundleFile, EntryFile } from "./files";

describe("files", () => {
  afterEach(() => sinon.restore());

  [
    { description: "EntryFile", factory: () => new EntryFile() },
    { description: "BundleFile", factory: createBundleFile }
  ].forEach(({ description, factory }) => {
    describe(description, () => {
      it("is created without any args", () => {
        const file = factory();
        assert.ok(file);
      });

      it("has a dir equal to os.tmpdir", () => {
        const file = factory();
        assert.equal(file.dir, os.tmpdir());
      });

      it("has a name based on type and current date", () => {
        sinon.stub(Date, "now").returns("111");
        const file = factory();
        assert.ok(file.name.indexOf("111") > 0);
      });
    });
  });

  describe(EntryFile.name, () => {
    it("can be touched", done => {
      const file = new EntryFile();
      file.touch().then(() => {
        fs.stat(file.path, done);
      });
    });

    it("allows addition of files", () => {
      const file = new EntryFile();
      return file
        .add("/path/to/file")
        .then(() => promisify(fs.readFile)(file.path))
        .then(cont => {
          assert.equal(cont.toString("utf8"), `import "../path/to/file";`);
        });
    });
  });
});
