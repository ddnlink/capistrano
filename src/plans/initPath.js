"use strict";
import plan from "@ddn/flightplan";

function initFolders(config) {
  const {
    application,
    deployTo,
    sharedDirectory,
    releasesDirectory,
    tmpDir
  } = config;
  const targetPath = deployTo + application;

  plan.remote(remote => {
    remote.log("Remote start...");

    // 初始化路径
    remote.exec("mkdir -p " + targetPath);
    remote.with(`cd ${targetPath}`, () => {
      remote.exec("mkdir -p " + sharedDirectory);
      remote.exec("mkdir -p " + releasesDirectory);
      remote.exec("mkdir -p " + tmpDir);
      remote.exec("mkdir -p repo");
    });
  });
}

export default initFolders;
