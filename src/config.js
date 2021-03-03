"use strict";

import fs from "fs";
import path from "path";
import extend from "extend2";
import { defaultConfig } from './default.config';

function getUserConfig(cwd, config) {
  const userConfigFile = path.join(cwd, config);
  let userConfig = {};

  const isExist = fs.existsSync(userConfigFile)
  if (isExist) {
    userConfig = require(userConfigFile);
  } else {
    console.error(
      "Failed!! Your deploy/config.js does not exist, please create it with `deploy install`."
    );
  }

  return userConfig;
}

function mergeConfigs(...configs) {
  return extend(true, ...configs);
}

const usersConfig = getUserConfig(process.cwd(), "/config/deploy/config.js") || {};

const userConfig = mergeConfigs(defaultConfig, usersConfig)

export default { userConfig };
