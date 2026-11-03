// Metro 0.82 expects image-size's v1 callable CommonJS export. The patched
// parser exports imageSize in v2; adapt the import without retaining v1 parsers.
const fs = require('node:fs');
const path = require('node:path');
const assetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'metro',
  'src',
  'Assets.js',
);
const source = fs.readFileSync(assetFile, 'utf8');
const oldImport = 'const getImageSize = require("image-size");';
const newImport =
  'const getImageSize = (input) => require("image-size").imageSize(typeof input === "string" ? fs.readFileSync(input) : input);';
if (source.includes(oldImport))
  fs.writeFileSync(assetFile, source.replace(oldImport, newImport));
else if (
  source.includes('const getImageSize = require("image-size").imageSize;')
)
  fs.writeFileSync(
    assetFile,
    source.replace(
      'const getImageSize = require("image-size").imageSize;',
      newImport,
    ),
  );
else if (!source.includes(newImport))
  throw new Error(
    'Metro image parser import changed: review the compatibility patch.',
  );
