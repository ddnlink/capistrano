
"use strict";

/**
 * 默认配置
 */
const defaultConfig = {
    application: "datm-server",
    deployTo: "/var/www/",
    scm: "git",
    repoUrl: "yourRepoUrl",
    branch: "master", // default 'master'
    linkedFiles: [], // config.prod.js
    linkedDirs: ["node_modules", "logs"], // node_modules
    keepReleases: 5,
    tmpDir: "tmp",
    pty: false,
    sharedDirectory: "shared",
    releasesDirectory: "releases",
    currentDirectory: "current",
    // server: {
    //     name: "", // nginx
    //     configFile: "" // nginx.conf
    // },
    // TODO: 删除场景配置
    // test
    // test: {
    //     target: {
    //         host: "localhost",
    //         username: "root",
    //         agent: process.env.SSH_AUTH_SOCK,
    //         password: ""
    //     }
    // },

    // // prod
    // prod: {
    //     target: {
    //         host: "192.168.1.1",
    //         username: "root",
    //         agent: process.env.SSH_AUTH_SOCK,
    //         privateKey: "" // path to .pem
    //     }
    // },

    target: [
        {
            host: "192.168.1.1",
            username: "root",
            agent: process.env.SSH_AUTH_SOCK,
            privateKey: "" // path to .pem
        }
    ]
};

export { defaultConfig };