var express = require('express');
var router = express.Router();
var Promise = require("bluebird");
var foreach = require("../tools/foreach");
var errors = require("../db/errors");
var perms = require("../db/perms");

function has_perms(user, obj, call_params_with_req, perms_list) {
  var all_checks = [];
  foreach(perms_list, function(i, perm_func){
    all_checks.push(perms.promisify_perm(perm_func).apply({}, [user, obj].concat(call_params_with_req)));
  });
  return Promise.all(all_checks);
}

router.post('/:model_name/:type/:method', function (req, res, next) {
  var source = req.body;
  console.log(source);
  if (!source.hasOwnProperty("params")){
    source = req.query;
    if (source["params"]) source["params"] = JSON.parse(source["params"]);
    if (source["instance"]) source["instance"] = JSON.parse(source["instance"]);
  }
  if (!source.hasOwnProperty("params")){
    return Promise.reject(errors.make400("Params not supplied"))
  }

  var model_name = req.params.model_name;
  var call_type = req.params.type;
  var method = req.params.method;

  try {
    function send_result(result) {
      if (result && typeof result=="object" && "then" in result) {
        return result
          .then(send_result)
          .catch(function (e) {
            return next(e);
          })
      }
      res.send(result);
      return Promise.resolve();
    }

    var call_params_with_req = source.params.concat([req]);
    if (!req.app.graph.models.hasOwnProperty(model_name)) {
      return next(new Error("Class name '" + model_name + "' not found"));
    }
    var model = req.app.graph.models[model_name];

    if (call_type != "instance" && call_type != "static") {
      return next(new Error("Method call should be either instance or static type"));
    }

    if (!source.hasOwnProperty("params")) {
      return next(new Error("Method call doesn't contain params list, at least empty"));
    }
    if (call_type == "instance") {
      if (!(method in model.prototype) || !("perms" in model.prototype[method])) {
        return next(new Error("Instance method '" + model_name + "." + method + "' with .perms not found"));
      }
      if (!source.hasOwnProperty("target_id")
      ) {
        return next(new Error("Instance method call doesn't contain target instance id"));
      }
      model.findOne({_id: source.target_id}).then(function (inst) {
        if (!inst) return next(errors.make404(model_name + " with id=" + source.target_id + " not found"));
        return has_perms(req.user, inst, call_params_with_req, model.prototype[method].perms).then(function () {
          if (method == "save_it") {
            if (!source.hasOwnProperty("instance")) {
              return next(new Error("Instance method call doesn't contain target instance id"));
            }
            if (!inst.savable) {
              return next(new Error("Instance has no savable fields"));
            }
            for (var k in inst.savable) {
              var field_name = inst.savable[k];
              if (!(field_name in inst)) {
                return next(new Error("Instance has bad savable field:" + field_name));
              }
              if (!(field_name in source.instance)) {
                return next(new Error("Savable field not specified at saving query:" + field_name));
              }
              inst[field_name] = source.instance[field_name];
            }
          }
          return send_result(inst[method].apply(inst, call_params_with_req));
        })
      }).catch(function(e){
        next(e);
      });
    }
    if (call_type == "static") {
      if (!model.hasOwnProperty(method) || !model[method].hasOwnProperty("perms")
      ) {
        return next(new Error("Model " + model_name + " static method '" + method + "' with .perms not found"));
      }
      has_perms(req.user, null, call_params_with_req, model[method].perms).then(function () {
        return send_result(model[method].apply(model, call_params_with_req));
      }).catch(function(e){
        next(e);
      })
    }
  }
  catch (e) {
    next(e);
  }

});

module.exports = router;
