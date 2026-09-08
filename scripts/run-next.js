// Cross-platform runner that preloads patch-readlink for Node on Windows/Linux
require("./patch-readlink.js");
require(require.resolve("next/dist/bin/next"));
