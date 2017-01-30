var Promise = require("bluebird");
var errors = require("./errors");
var foreach = require("../tools/foreach");
var check_ids_equal = require("../tools/check_ids_equal");

var perms = {};

perms.promisify_perm = function(perm_func){
  return function() {
    var ret = null;
    try {
      ret = perm_func.apply({}, Array.prototype.slice.call(arguments));
    } catch (e) {
      ret = Promise.reject(e);
    }
    if (typeof (ret) == 'boolean') {
      ret = ret ? Promise.resolve() : Promise.reject(new Error("Unknown validation error (please, throw messaged errors on invalid case)"));
    }
    return ret;
  }
};

perms.everybody = function (user, obj) {
  return Promise.resolve();
};

perms.any = function () {
  var args = Array.prototype.slice.call(arguments);
  return function (user, obj) {
    var any_resolve = false;
    var all_errors = [];
    var err_msgs = [];
    var awaiting = [];

    foreach(args, function (i, arg) {
      awaiting.push(perms.promisify_perm(arg)(user, obj)
        .then(function () {
          any_resolve = true;
        })
        .catch(function (e) {
          all_errors.push(e);
          err_msgs.push(e.message);
        }))
    });
    return Promise.all(awaiting).then(function(){
      if (!any_resolve) {
        var error = errors.make403("No of permission rules satisfied: " + err_msgs.join(", ")); // TODO: debug child errors
        error.child_errors = all_errors;
        return Promise.reject(error);
      }
      return Promise.resolve();
    });
  }
};

perms.all = function () {
  var args = Array.prototype.slice.call(arguments)
  return function (user, obj) {
    var all_resolve = true;
    var all_errors = [];
    var awaiting = [];

    foreach(args, function (i, arg) {
      awaiting.push(perms.promisify_perm(arg)(user, obj)
        .catch(function (e) {
          all_errors.push(e);
          all_resolve = false;
        }))
    });
    return Promise.all(awaiting).then(function(){
      if (!all_errors) {
        var error = errors.make403("Some of permission rules not satisfied"); // TODO: debug child errors
        error.child_errors = all_errors;
        return Promise.reject(error);
      }
      return Promise.resolve();
    });
  }
};

perms.is_logged_in = function (user, obj) {
  if (!user) {
    return Promise.reject(errors.make403("User is not logged in"))
  }
  return Promise.resolve();
};

perms.is_superuser = function (user, obj) {
  if (!user || !user.is_superuser) {
    return Promise.reject(errors.make403("User is not a superuser"))
  }
  return Promise.resolve();
};

perms.is_staff = function (user, obj) {
  if (!user || !user.is_staff) {
    return Promise.reject(errors.make403("User is not a staff"))
  }
  return Promise.resolve();
};

perms.is_owner = function (user, obj) {
  if (!obj.owner || !check_ids_equal(user, obj.owner)) {
    return Promise.reject(errors.make403("User is not the owner"))
  }
  return Promise.resolve();
};

perms.is_not_published = function (user, obj) {
  if (obj.is_published==undefined || obj.is_published) {
    return Promise.reject(errors.make400("Can't affect published Object"))
  }
  return Promise.resolve();
};

module.exports = perms;