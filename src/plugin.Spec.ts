// eslint-env mocha
import * as assert from "assert";
import * as sinon from "sinon";
import { Logger } from "./types";
import { ParcelPlugin, createParcelPlugin } from "./plugin";
import { EntryFile, BundleFile } from "./files";
import * as path from "path";
import { promisify } from "util";
import * as fs from "fs";

describe("plugin", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      debug: sinon.stub()
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
        const plugin = new ParcelPlugin(logger);

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
        const plugin = new ParcelPlugin(logger);

        return plugin
          .addFile({
            originalPath: path.join(process.cwd(), "tests/javascript.Spec.js"),
            path: "/the/path",
            relativePath: "/relative/path",
            sourceMap: "sourceMaps"
          })
          .then(() => {
            return plugin.bundle();
          })
          .then((bundleFile: BundleFile) => bundleFile.exists())
          .then((exists: boolean) => assert.equal(exists, true));
      });

      it("emits content of more than one file", () => {
        const plugin = new ParcelPlugin(logger);

        return plugin
          .addFile({
            originalPath: path.join(process.cwd(), "tests/javascript.Spec.js"),
            path: "/the/path",
            relativePath: "/relative/path",
            sourceMap: "sourceMaps"
          })
          .then(() =>
            plugin.addFile({
              originalPath: path.join(
                process.cwd(),
                "tests/js-with-import.Spec.js"
              ),
              path: "/the/path/2",
              relativePath: "/relative/path/2",
              sourceMap: "sourceMaps"
            })
          )
          .then(() => plugin.bundle())
          .then((bundleFile: BundleFile) =>
            promisify(fs.readFile)(bundleFile.path)
          )
          .then(buffer => {
            const content = buffer.toString("utf8");
            assert.ok(content.indexOf(`describe("js-with-import",`));
            assert.ok(content.indexOf(`describe("javascript",`));
          });
      });
    });
  });
});
