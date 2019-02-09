// eslint-env mocha
import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as rimraf from "rimraf";
import * as sinon from "sinon";
import { promisify } from "util";
import { createWorkspaceSync, EntryFile } from "./files";
import mkdirp = require("mkdirp");

describe("files", () => {
  afterEach(() => sinon.restore());

  it("exports createWorkspace", () => {
    assert.ok(createWorkspaceSync);
  });

  describe("createWorkspaceSync", () => {
    const cwd = os.tmpdir();

    beforeEach(() => {
      // make sure no karma-parcel folder exists
      return promisify(rimraf)(path.join(cwd, ".karma-parcel")).then(() => {
        sinon.stub(process, "cwd").returns(cwd);
      });
    });

    it("returns a Workspace", () => {
      const workspace = createWorkspaceSync();

      assert.ok(workspace);
      assert.equal(workspace.toString(), "Workspace()");
    });

    it("creates a directory named .karma-parcel in process.cwd()", () => {
      createWorkspaceSync();

      return promisify(fs.stat)(path.join(cwd, ".karma-parcel"));
    });

    it("removes previously created directory", () => {
      const dir = path.join(cwd, ".karma-parcel");
      const fileInDir = path.join(dir, "xxx");
      mkdirp.sync(dir);

      return promisify(fs.writeFile)(fileInDir, "xxx")
        .then(() => createWorkspaceSync())
        .then(() => promisify(fs.stat)(fileInDir))
        .then(
          stat => assert.fail(`Expected ${fileInDir} not to exists`),
          e => assert.ok(e)
        );
    });

    it("creates an empty index.js in .karma-parcel", () => {
      createWorkspaceSync();

      return promisify(fs.stat)(path.join(cwd, ".karma-parcel", "index.js"));
    });

    describe("Workspace", () => {
      it("exports the created dir as .dir", () => {
        const workspace = createWorkspaceSync();

        assert.ok(workspace.dir);
        assert.equal(workspace.dir, path.join(cwd, ".karma-parcel"));
      });

      it("exports an EntryFile ", () => {
        const workspace = createWorkspaceSync();

        assert.ok(workspace.entryFile);
        assert.ok(workspace.entryFile.toString().indexOf("EntryFile(") === 0);
      });
    });
  });

  describe(EntryFile.name, () => {
    function workspace(dir = os.tmpdir()) {
      return promisify(rimraf)(path.join(dir, ".karma-parcel")).then(() => {
        sinon.stub(process, "cwd").returns(dir);
        return createWorkspaceSync();
      });
    }

    it("allows addition of files", () => {
      return workspace().then(w => {
        const file = w.entryFile;
        return file
          .add("/path/to/file")
          .then(() => promisify(fs.readFile)(file.path))
          .then(cont => {
            assert.equal(cont.toString("utf8"), `import "../../path/to/file";`);
          });
      });
    });

    it("adds the files relative to the dir", () => {
      const tmpDir = path.join(os.tmpdir(), "karma-parcel-tmp");

      return workspace(tmpDir)
        .catch(err => {
          if (err.code === "EEXIST") {
            return;
          }
          throw err;
        })
        .then(() => {
          const file = createWorkspaceSync().entryFile;

          return file
            .add("/path/other/file")
            .then(() => promisify(fs.readFile)(file.path))
            .then(cont => {
              assert.equal(
                cont.toString("utf8"),
                `import "../../../path/other/file";`
              );
            });
        });
    });

    it("adds './' to the imported file if needed", () => {
      const tmpDir = path.join(os.tmpdir(), "karma-parcel-tmp");

      return workspace(tmpDir)
        .catch(err => {
          if (err.code === "EEXIST") {
            return;
          }
          throw err;
        })
        .then(() => {
          const { entryFile: file, dir } = createWorkspaceSync();
          return file
            .add(path.join(dir, "path/other/file"))
            .then(() => promisify(fs.readFile)(file.path))
            .then(cont => {
              assert.equal(
                cont.toString("utf8"),
                `import "./path/other/file";`
              );
            });
        });
    });
  });
});
