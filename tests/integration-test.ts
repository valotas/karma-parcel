// eslint-env mocha
import * as karma from "karma";
import * as assert from "assert";
import * as path from "path";

function readConfig(options: karma.ConfigOptions = {}) {
  const karmaFile = path.join(__dirname, "fixtures", "karma.conf.js");
  return (karma as any).config.parseConfig(karmaFile, options);
}

function run(options: karma.ConfigOptions = {}): Promise<karma.TestResults> {
  const conf = readConfig(options);
  return new Promise((resolve, reject) => {
    let testResults: karma.TestResults;

    const karmaServer = new karma.Server(conf, () => {
      resolve(testResults);
    });

    karmaServer.once("run_complete", (_browsers, results, err) => {
      if (err) {
        reject(new Error(`Karma did not complete`));
      } else {
        testResults = results;
      }
    });

    karmaServer.start();
  });
}

describe("integration test", () => {
  it("runs js tests", () => {
    return run({
      files: ["./**/javascript.Spec.js"]
    }).then(results => {
      assert.ok(results);
      assert.equal(results.success, 1);
      assert.equal(results.failed, 1);
    });
  });

  it("runs ts tests", () => {
    return run({
      files: ["./**/typescript.Spec.ts"]
    }).then(results => {
      assert.ok(results);
      assert.equal(results.success, 1);
      assert.equal(results.failed, 1);
    });
  });

  it("runs all", () => {
    return run({
      files: ["./*.Spec.ts", "./*.Spec.js", "non-parcel-test.js"]
    }).then(results => {
      assert.ok(results);
      assert.equal(results.success, 4);
      assert.equal(results.failed, 2);
    });
  });
});
