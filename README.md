# Karma Parcel

Use [parcel][] to preprocess [karma][] tests

## Install

To get all the needed packages;

```
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
    files: [ "tests/**/*.js", "parcel/**/*.js"]

    // let karma know which of the test files should be bundled
    // with parcel
    preprocessors: {
      "tests/*": ["parcel"]
    }
  });
};
```

[parcel]: https://parceljs.org/
[karma]: https://karma-runner.github.io
