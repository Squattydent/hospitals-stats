var foreach = require("./foreach");
var Promise = require("bluebird");

var filter = function (o, cb) {
  var ret = [];
  foreach(o, function (k, v) {
    if (cb(v)) ret.push(v);
  });
  return ret;
};

var filter_p = function (o, cb) {
  var ret = [];
  var awaiting = [];
  foreach(o, function (k, v) {
    awaiting.push(Promise.resolve(cb(v))
      .then(function (r) {
        if (r) ret.push(v);
      }))
  });
  return Promise.all(awaiting)
    .then(function () {
      return ret;
    })
};

//  EXAMPLE:
//
//  filter(obj, function(value) {
//    // do things
//    return [true|false]
//  });

module.exports = {filter: filter, filter_p: filter_p};