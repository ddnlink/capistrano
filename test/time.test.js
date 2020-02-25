const fs = require('fs');
const moment = require("moment");

const path = `revisions.log`;
const Countfile = fs.existsSync(path);

const currentRepo = moment()
  .format("YYYYMMdhmmss")
  .toString();

//   console.log(a.format("YYYYMMdhmmss").toString());

// remote.exec(`cp -r repo ${currentRepo}`);

if (!Countfile) {
  fs.writeFileSync(path, currentRepo);
} else {
    const old = fs.readFileSync(path, "utf-8");
    fs.writeFileSync(path, old + "," + currentRepo);
  }
