const chalk = require("chalk");
const Inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");

const log = console.log;
module.exports = async () => {
  const { token } = await Inquirer.prompt({
    name: "token",
    type: "input",
    message: "请输入当前项目token，不能为空",
  });
  if (!token) {
    log(chalk.red("请输入你的私有 git token 值"));
    return;
  }
  const content = JSON.stringify({
    token,
  });
  const filePath = path.resolve(__dirname, "../", "secret.json");
  fs.writeFileSync(filePath, content, "utf8", function (error) {
    if (error) {
      log(chalk.red(error));
      return false;
    }
    log(chalk.green("写入成功"));
  });
};
