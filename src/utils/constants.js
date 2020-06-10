const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const { version } = require("../../package.json");

const DOWN_NAME = `${
  process.env[process.platform === "darwin" ? "HOME" : "USERPROFILE"]
}/.template`;
const PROMPTS_NAME = "prompts.js";
const SCAN_FILE = [".js", ".json", ".env", ".env.dev", ".sh", ".yml"];

let token = "";
try {
  const info = require("../../secret.json");
  token = info.token;
} catch (e) {
  const filePath = path.resolve(__dirname, "../../", "secret.json");
  fs.writeFileSync(filePath, "", "utf8", function (error) {
    if (error) {
      log(chalk.red(error));
      return false;
    }
  });
}

module.exports = {
  name: "frontendcli",
  git: "192.168.11.206",
  version,
  DOWN_NAME,
  PROMPTS_NAME,
  SCAN_FILE,
  TOKEN: token,
};
