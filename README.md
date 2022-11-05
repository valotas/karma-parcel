# Karma Parcel

Use [parcel v2][] to preprocess [karma][] tests

**Notice:** v0.7 or newer of this plugin supports parcel v2 and karma v6. If for whatever
reason need to make use of parcel v1, please use [karma-parcel@0.6](https://www.npmjs.com/package/karma-parcel/v/0.6.1)

## Install

To get all the needed packages:

```bash
npm i karma parcel karma-parcel -D
```

## Configure:

Add `parcel` to the frameworks to be used and to the files that should be preprocessed with it:

```js
module.exports = function (config) {
  config.set({
    frameworks: ["mocha", "parcel"],

    // add patterns with all your tests even if they should not
    // be handled by parcel
    files: [
      "tests/**/*.js",
      {
        // parcel tests should not be watched. Parcel will do the
        // watching instead
        pattern: "parcel/**/*.js",
        watched: false,
        included: false,
      },
    ],

    // let karma know which of the test files should be bundled
    // with parcel
    preprocessors: {
      "parcel/*": ["parcel"],
    },
  });
};
```

### `parcelConfig`

some more parcel specific configuration can be passed to the underlying parcel
instance via the `parcelConfig` attribute of your karma configuration:

```js
module.exports = function (config) {
  config.set({
    // lot of karma configuration
    parcelConfig: {
      cacheDir: "/path/to/cache", // default: "./.cache"
      detailedReport: true, // default: false,
      logLevel: "verbose",
    },
  });
};
```

### `karmaParcelWorkspace`

make use of this in order to define a workspace other than current directory:

```js
module.exports = function (config) {
  config.set({
    // ... lot of karma configuration
    // use /tmp/foo/bar as the workspace
    karmaParcelWorkspace: path.join(os.tmpdir(), "foo", "bar"),
    parcelConfig: { /* the parcel config*/ },
  });
};
```

## Under the hood

Parcel will create one bundle with all the files that are preprocessed with
the `parcel` preprocessor. The preprocessor will emit an empty file instead of
the actual content. The plugin will register a bundle file to karma's
fileList with `serve: false` in order not to be handled by karma's middleware.
To serve the bundled file, parcel's own middleware is registered and used

# Related

This plugin is heavily inspired by [`karma-browserify`][karma-browserify] and
[`karma-webpack`][karma-webpack].

[parcel]: https://parceljs.org/
[karma]: https://karma-runner.github.io
[karma-browserify]: https://github.com/nikku/karma-browserify
[karma-webpack]: https://github.com/webpack-contrib/karma-webpack
