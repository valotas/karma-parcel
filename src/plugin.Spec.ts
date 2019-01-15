// eslint-env mocha
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as sinon from "sinon";
import { promisify } from "util";
import * as bundler from "./bunlder";
import { createBundleFile, EntryFile, IFile } from "./files";
import { createParcelPlugin, ParcelPlugin } from "./plugin";
import { Logger } from "./types";
import karma = require("karma");

class EmitterStub {
  refreshFile() {
    // do nothing
  }
}

describe("plugin", () => {
  let logger: Logger;
  let karmaConf: karma.ConfigOptions;

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      debug: sinon.stub()
    };
    karmaConf = {
      autoWatch: false
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  it("exposes a ParcelPlugin", () => {
    assert.ok(ParcelPlugin);
  });

  it("exposes a factory", () => {
    assert.ok(createParcelPlugin);
  });

  describe(ParcelPlugin.name, () => {
    describe("addFile", () => {
      it("writes the file to the underlying entry file", () => {
        const add = sinon.stub(EntryFile.prototype, "add").resolves(null);
        const plugin = new ParcelPlugin(logger, karmaConf, new EmitterStub());

        return plugin
          .addFile({
            originalPath: "/original/path",
            path: "/the/path",
            relativePath: "/relative/path",
            sourceMap: "sourceMaps"
          })
          .then(() => {
            sinon.assert.calledWith(add, "/original/path");
          });
      });
    });

    describe("bundle", () => {
      it("emits the bundled content into a bundle file", () => {
        const plugin = new ParcelPlugin(logger, karmaConf, new EmitterStub());
        plugin.setBundleFile(createBundleFile());

        return plugin
          .addFile({
            originalPath: path.join(
              process.cwd(),
              "tests/fixtures/javascript.Spec.js"
            ),
            path: "/the/path",
            relativePath: "/relative/path",
            sourceMap: "sourceMaps"
          })
          .then(() => plugin.bundle())
          .then((bundleFile: IFile) => bundleFile.exists())
          .then((exists: boolean) => assert.equal(exists, true));
      }).timeout(10000);

      it("emits content of more than one file", () => {
        const plugin = new ParcelPlugin(logger, karmaConf, new EmitterStub());
        plugin.setBundleFile(createBundleFile());

        return plugin
          .addFile({
            originalPath: path.join(
              process.cwd(),
              "tests/fixtures/javascript.Spec.js"
            ),
            path: "/the/path",
            relativePath: "/relative/path",
            sourceMap: "sourceMaps"
          })
          .then(() =>
            plugin.addFile({
              originalPath: path.join(
                process.cwd(),
                "tests/fixtures/js-with-import.Spec.js"
              ),
              path: "/the/path/2",
              relativePath: "/relative/path/2",
              sourceMap: "sourceMaps"
            })
          )
          .then(() => plugin.bundle())
          .then((bundleFile: IFile) => promisify(fs.readFile)(bundleFile.path))
          .then(buffer => {
            const content = buffer.toString("utf8");
            assert.ok(content.indexOf(`describe("js-with-import",`));
            assert.ok(content.indexOf(`describe("javascript",`));
          });
      }).timeout(10000);

      it("does only bundle once", () => {
        const bundle = sinon.stub(bundler, "bundle").resolves({});
        const plugin = new ParcelPlugin(logger, karmaConf, new EmitterStub());
        plugin.setBundleFile(createBundleFile());

        return plugin
          .addFile({
            originalPath: path.join(
              process.cwd(),
              "tests/fixtures/javascript.Spec.js"
            ),
            path: "/the/path",
            relativePath: "/relative/path",
            sourceMap: "sourceMaps"
          })
          .then(() => plugin.bundle())
          .then(() => sinon.assert.calledOnce(bundle))
          .then(() => plugin.bundle())
          .then(() => sinon.assert.calledOnce(bundle));
      });

      it("passes to the bundle watch = true when autoWatch == true", () => {
        const bundle = sinon.stub(bundler, "bundle").resolves({});
        const plugin = new ParcelPlugin(
          logger,
          {
            autoWatch: true
          },
          new EmitterStub()
        );
        plugin.setBundleFile(createBundleFile());

        return plugin
          .addFile({
            originalPath: path.join(
              process.cwd(),
              "tests/fixtures/javascript.Spec.js"
            ),
            path: "/the/path",
            relativePath: "/relative/path",
            sourceMap: "sourceMaps"
          })
          .then(() => plugin.bundle())
          .then(() => {
            sinon.assert.calledWithMatch(bundle, sinon.match.any, {
              watch: true
            });
          });
      });
    });
  });
});
