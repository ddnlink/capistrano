import plan from "flightplan";

function upload(userConfig) {
  const { application, deployTo } = userConfig;
  const targetPath = deployTo + application;

  let configFile;

  plan.remote(remote => {
    configFile = remote.runtime.config;
  });

  plan.local(local => {
    if (configFile) {
      console.log(`1 Upload config file ${configFile} for this `);

      local.with("cd config/deploy", () => {
        // 先清理，不然不改变
        local.exec("rm -rf ./configures.tar.gz");

        local.exec("tar zcf configures.tar.gz ./configures");
        local.transfer(
          "configures.tar.gz",
          targetPath + "/" + userConfig.sharedDirectory
        );
      });
    }
  });
}

export default upload;
