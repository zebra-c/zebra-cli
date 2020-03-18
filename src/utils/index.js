const ora = require('ora');

 const wrapFetchAddLoding = (fn, message) => async (...args) => {
  const spinner = ora(message);
  spinner.start(); // 开始
  const r = await fn(...args);
  spinner.succeed(); // 结束
  return r;
};

module.exports = {
  wrapFetchAddLoding
}