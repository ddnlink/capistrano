import plan from "flightplan";

function useServer(userConfig) {
  const { application, deployTo } = userConfig;
  const targetPath = deployTo + application;

  if (userConfig.server && userConfig.server.name === "nginx") {
    // console.log(userConfig.server.name);

    plan.local(local => {
      local.log("Upload the server config ...");
      local.with("cd config/deploy", () => {
        local.transfer(
          userConfig.server.configFile,
          targetPath + "/" + userConfig.sharedDirectory
        );
      });
    });

    plan.remote(remote => {
      remote.log("Link the config");
      // 这个是危险操作，建议确认之后再操作
      // remote.exec("rm -f /etc/nginx/sites-enabled/default");
      const nginxConfig = `${targetPath}/${userConfig.sharedDirectory}/${userConfig.server.configFile}`;
      remote.exec(
        `if [ ! -f ${nginxConfig} ]; then ln -s ${nginxConfig} /etc/nginx/sites-enabled/${userConfig.server.configFile}; fi`
      );
      remote.exec("sudo service nginx restart");
    });
  }
}

export default useServer;
