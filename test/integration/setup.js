const finalhandler = require("finalhandler");
const http = require("http");
const serveStatic = require("serve-static");

exports.createHTTPServer = async (path) => {
  var serve = serveStatic(path);

  var server = http.createServer((req, res) => {
    serve(req, res, finalhandler(req, res));
  });

  return new Promise((resolve, reject) => {
    server.listen((err) => {
      if (err) {
        reject(err);
      } else {
        resolve(server);
      }
    });
  });
};
