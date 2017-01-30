function APIClient(){
  var self = this;
  self.user_id = null;
  self.token_value = null;
  self.models = null;
  self.settings = null;
}

APIClient.prototype.init = function(settings_url){
  var self = this;
  settings_url = settings_url || "/get_settings";
  return $.ajax({
    url: settings_url,
    method: "POST",
    data: {},
    dataType: "json"
  })
    .then(function (settings) {
      var create_model_pair = function(model_name) {
        var model_constructor = function(){
          this._model_name = model_name; // TODO: remove
        };
        var model = function (obj) {
          var ret = new model_constructor();
          ret._obj = obj;
          return ret;
        };
        return [model, model_constructor];
      };
      var register_methods = function(model, model_constructor){
        for (var k in model.prototype){
          model_constructor.prototype[k] = model.prototype[k];
        }
      };
      var create_model_method = function(model_name, method_name){
        return function(){
          var args = Array.prototype.slice.call(arguments);
          return self.query_model_method(model_name, this._obj, "instance", method_name, args);
        };
      };
      var create_model_static_method = function(model_name, method_name){
        return function(){
          var args = Array.prototype.slice.call(arguments);
          return self.query_model_method(model_name, null, "static", method_name, args);
        }
      };
      self.models = {};
      for (var model_name in settings.MODELS){
        var model_info = settings.MODELS[model_name];
        var model_pair = create_model_pair(model_name);
        var model = model_pair[0];
        var model_constructor = model_pair[1];
        for (var method_name in model_info.methods){
          model.prototype[method_name] = create_model_method(model_name, method_name);
        }
        for (var method_name in model_info.static_methods){
          model[method_name] = create_model_static_method(model_name, method_name);
        }
        register_methods(model, model_constructor);
        self.models[model_name] = model;
      }

      return self.settings = settings;
    })
    .fail(function (jqXHR, text, e) {
      self.show_fail("Server error", "Failed to get settings. " + e.message);
    })  
};

APIClient.prototype.query_model_method = function(model_name, instance, call_type, method, params) {
  var self = this;
  var data = {
    "token_value": self.token_value || "",
    "user_id": self.user_id || "",
    "params": params ? params : [],
    "target_id": call_type=="instance"?instance._id:null,
    "instance":  call_type=="instance"?instance:null
  };
  return $.ajax({
    url: self.settings.SERVER_ROOT_URI + self.settings.MODELS_URI_PATH
      .replace("{{model_name}}", model_name)
      .replace("{{call_type}}", call_type)
      .replace("{{method}}", method),
    method: "POST",
    data: JSON.stringify(data),
    contentType: 'application/json; charset=utf-8',
    dataType: "json"
  })
    .fail(function (jqXHR, text, e) {
      console.log(jqXHR, text, e);
      alert("Action Failed:" + jqXHR.getResponseHeader("err-message") + " - " + e); //TODO: involve better error handling for unexpected server responses
    })
};

APIClient.prototype.set_credentials = function(user_id, token){
  var self = this;
  self.user_id = user_id;
  self.token_value = token;
};


module.exports = APIClient;