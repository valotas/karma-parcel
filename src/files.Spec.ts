// eslint-env mocha
import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as sinon from "sinon";
import { promisify } from "util";
import { BundleFile, EntryFile } from "./files";

describe("files", () => {
  afterEach(() => sinon.restore());

  it("exports EntryFile", () => {
    assert.ok(EntryFile);
  });

  it("exports BundleFile", () => {
    assert.ok(BundleFile);
  });

  [EntryFile, BundleFile].forEach(Const => {
    describe(Const.name, () => {
      it("is created without any args", () => {
        const file = new Const();
        assert.ok(file);
      });

      it("has a dir equal to os.tmpdir", () => {
        const file = new Const();
        assert.equal(file.dir, os.tmpdir());
      });

      it("has a name based on type and current date", () => {
        sinon.stub(Date, "now").returns("111");
        const file = new Const();
        assert.ok(file.name.indexOf("111") > 0);
      });

      if (Const === EntryFile) {
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
      }
    });
  });
});
