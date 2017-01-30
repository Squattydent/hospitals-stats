var foreach = function (o, cb) {
  if (!o) throw new Error("Cannot iterate over non-object");
  var keys = Object.keys(o);
  if (!(o instanceof Array)) {
    keys.sort();
  }
  var len = keys.length;

  for (var counter = 0; counter < len; counter++) {
    var key = keys[counter];
    if (cb(key, o[key]) === false){
      return false;
    }
  }
  return true;
};

//  EXAMPLE:
//
//  forEach(obj, function(key, value) {
//    // do things
//  });

module.exports = foreach;