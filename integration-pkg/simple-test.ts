const assert = require("assert");
const imported = require("super-dependency");

describe("simple-test-ts", () => {
  it("works", () => {
    assert.ok(imported.foo);
  });

  it("returns bar", () => {
    assert.equal(imported.foo(), "bar");
  });
});
