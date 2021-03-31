import plan from "@ddn/flightplan";

function uploadPeer(userConfig) {
  const { application, deployTo, uploadFileName } = userConfig;
  const targetPath = deployTo + application;

  plan.local(local => {
      console.log(`Upload ddn.tar.gz file `);

      local.with("cd build/", () => {
        // 先清理，不然不改变

        local.transfer(
          uploadFileName + userConfig.extendName,
          targetPath + "/" + userConfig.releasesDirectory
        );
      });
  });
}

export default uploadPeer;
