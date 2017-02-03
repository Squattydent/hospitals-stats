function APIClient() {
  var self = this;
  self.user_id = null;
  self.token_value = null;
  self.models = null;
  self.settings = null;
}

APIClient.prototype.show_fail = function (title, message) {
  console.error(title, message);
  window.alert(title + ': ' + message);
};

APIClient.prototype.init = function (settings_url) {
  var self = this;
  settings_url = settings_url || '/get_settings';

  var request = new XMLHttpRequest();
  request.open('POST', settings_url, true);
  request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

  return new Promise(function (resolve, reject) {
    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var resp = request.responseText;

        var settings = JSON.parse(resp);
        var create_model_pair = function (model_name) {
          var ModelConstructor = function () {
            this._model_name = model_name; // TODO: remove
          };
          var model = function (obj) {
            var ret = new ModelConstructor();
            ret._obj = obj;
            return ret;
          };
          return [model, ModelConstructor];
        };
        var register_methods = function (model, model_constructor) {
          for (var k in model.prototype) {
            model_constructor.prototype[k] = model.prototype[k];
          }
        };
        var create_model_method = function (model_name, method_name) {
          return function () {
            var args = Array.prototype.slice.call(arguments);
            return self.query_model_method(model_name, this._obj, 'instance', method_name, args);
          };
        };
        var create_model_static_method = function (model_name, method_name) {
          return function () {
            var args = Array.prototype.slice.call(arguments);
            return self.query_model_method(model_name, null, 'static', method_name, args);
          }
        };
        self.models = {};
        for (var model_name in settings.MODELS) {
          var model_info = settings.MODELS[model_name];
          var model_pair = create_model_pair(model_name);
          var model = model_pair[0];
          var model_constructor = model_pair[1];
          var method_name;
          for (method_name in model_info.methods) {
            model.prototype[method_name] = create_model_method(model_name, method_name);
          }
          for (method_name in model_info.static_methods) {
            model[method_name] = create_model_static_method(model_name, method_name);
          }
          register_methods(model, model_constructor);
          self.models[model_name] = model;
        }
        self.settings = settings;
        return resolve(self.settings);
      } else {
        // We reached our target server, but it returned an error
        self.show_fail('Server error', 'Failed to get settings. ' + request.responseText);
        return reject();
      }
    };
    request.onerror = function () {
      // There was a connection error of some sort
      self.show_fail('Connection error', 'Failed to get settings. ' + request.responseText);
      return reject();
    };
    request.send();
  });
};

APIClient.prototype.query_model_method = function (model_name, instance, call_type, method, params) {
  var self = this;
  var data = {
    'token_value': self.token_value || '',
    'user_id': self.user_id || '',
    'params': params !== undefined ? params : [],
    'target_id': call_type === 'instance' ? instance._id : null,
    'instance': call_type === 'instance' ? instance : null
  };

  var request = new XMLHttpRequest();
  request.open('POST', self.settings.SERVER_ROOT_URI + self.settings.MODELS_URI_PATH
      .replace('{{model_name}}', model_name)
      .replace('{{call_type}}', call_type)
      .replace('{{method}}', method), true);
  request.setRequestHeader('Content-Type', 'application/json; charset=utf-8');

  return new Promise(function (resolve, reject) {
    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        // Success!
        var resp = request.responseText;
        var ret = JSON.parse(resp);
        return resolve(ret);
      } else {
        // We reached our target server, but it returned an error
        self.show_fail('Action failed', '' + request.responseText);
        return reject();
      }
    };
    request.onerror = function () {
      // There was a connection error of some sort
      self.show_fail('Connection error', 'Action failed. ' + request.responseText);
      return reject();
    };
    request.send(JSON.stringify(data));
  });
};

APIClient.prototype.set_credentials = function (user_id, token) {
  var self = this;
  self.user_id = user_id;
  self.token_value = token;
};

module.exports = APIClient;
