var Promise = require("bluebird");
var mongoose = require('mongoose');

mongoose.Promise = Promise;

function get_mongoose_connection(mongoose_settings) {
  var options = {
    server: { poolSize: mongoose_settings.POOL_SIZE }
  };
  mongoose.connect(mongoose_settings.URI, options);
  var conn = mongoose.connection;
  conn.on('error', console.error.bind(console, 'connection error:'));
  // On official docs it is recommend to use .once("open", function(){...})
  // But mongoose will buffer up all commands before connect,
  // So, we will get their results after connection opened.
  // http://stackoverflow.com/questions/11910842/mongoose-connection-models-need-to-always-run-on-open
  return conn;
}

module.exports = get_mongoose_connection;