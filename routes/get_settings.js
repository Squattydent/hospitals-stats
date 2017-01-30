var express = require('express');
var router = express.Router();
var extend = require('extend');

router.all('', function(req, res, next) {
  var ret = extend(req.app.settings.CLIENT);

  var models = {};
  ret.MODELS = models;
  for (var model_name in req.app.graph.models) {
    var model = req.app.graph.models[model_name];
    models[model_name] = {methods: {}, static_methods: {}};

    for (var field_name in model){
      var field = model[field_name];
      if (!field || !field.perms) continue;
      models[model_name].static_methods[field_name] = {}
    }
    for (var field_name in model.prototype){
      try {
        var field = model.prototype[field_name];
        if (!field || !field.perms) continue;
        models[model_name].methods[field_name] = {}
      }
      catch (e){ // TODO: optimize prototype methods obtaining
      }
    }
  }
  
  
  res.send(ret);
});

module.exports = router;
