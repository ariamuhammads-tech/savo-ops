const fs = require("fs");

const origReadlink = fs.readlink;
const origReadlinkSync = fs.readlinkSync;
const origPromisesReadlink = fs.promises ? fs.promises.readlink : null;

function mapError(err) {
  if (err && (err.code === "EISDIR" || err.message?.includes("illegal operation on a directory"))) {
    err.code = "EINVAL";
    err.errno = -4071;
  }
  return err;
}

fs.readlink = function (path, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  return origReadlink.call(fs, path, options, (err, linkString) => {
    callback(mapError(err), linkString);
  });
};

fs.readlinkSync = function (path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    throw mapError(err);
  }
};

if (origPromisesReadlink) {
  fs.promises.readlink = async function (path, options) {
    try {
      return await origPromisesReadlink.call(fs.promises, path, options);
    } catch (err) {
      throw mapError(err);
    }
  };
}
