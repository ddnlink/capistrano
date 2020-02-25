"use strict";

import fs from "fs";
import path from "path";
import extend from "extend2";

/**
 * 默认配置
 */
const defaultConfig = {
  application: "datm-server",
  deployTo: "/var/www/",
  scm: "git",
  repoUrl: "yourRepoUrl",
  branch: "master", // default 'master'
  linkedFiles: ["config.prod.js"], // config.prod.js
  linkedDirs: ["node_modules", "logs"], // node_modules
  keepReleases: 5,
  tmpDir: "tmp",
  pty: false,
  sharedDirectory: "shared",
  releasesDirectory: "releases",
  currentDirectory: "current",
  server: {
    name: "", // nginx
    configFile: "" // nginx.conf
  },
  // test
  test: {
    target: {
      host: "localhost",
      username: "root",
      agent: process.env.SSH_AUTH_SOCK,
      password: ""
    }
  },

  // prod
  prod: {
    target: {
      host: "192.168.1.1",
      username: "root",
      agent: process.env.SSH_AUTH_SOCK,
      privateKey: "" // path to .pem
    }
  }
};

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
// console.log(configed);
export default { userConfig, defaultConfig };
