// generate.js
const fs = require("fs");
const path = require("path");

/*

    VERSION

    1 - get package 
    2 - export a constant VERSION

 */

const pkg = require("../package.json");

fs.writeFileSync(
  "./src/sw/version.ts",
  `export const VERSION = '${pkg.version}';\n`
);

/*

    APP FILE LIST

    1 - get file list 
    2 - export a constant APP_FILE_LIST

 */

const folderPath = "./dist";

function getAllFilesInDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    return entry.isDirectory() ? getAllFilesInDir(fullPath) : [fullPath];
  });
}

fs.writeFileSync(
  "./src/sw/app-file-list.ts",
  `export const APP_FILE_LIST = [
  "/",
    ${getAllFilesInDir(folderPath)
      .map((i) => "'" + i.slice(4) + "'")
      .join(", \n")}
];`
);
