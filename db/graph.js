var get_mongoose_connection = require("./connections/get_mongoose_connection");
var settings = require("../settings");
var foreach = require("../tools/foreach");
var fs = require("fs");

function Graph(settings){
  var self = this;

  self.models = {};
  self.mongo_db = get_mongoose_connection(settings.DB.MONGOOSE);

  self.register_all_models = function (path) {
    var ret = {};

    var files = fs.readdirSync(path);

    foreach(files, function(i, file){
      if (file.substr(file.length-3) != ".js") return true;
      var module = require("../" + path + file);
      if (!module || !module.hasOwnProperty("model")) return true;
      if (!module.hasOwnProperty("schema")) throw new Error("Model file doesn't export schema: " + file);
      if (!module.schema.hasOwnProperty("options")) throw new Error("Bad schema export (no options field): " + file);
      module.schema.options.toJSON = {
        transform: function(doc, ret) {
          if (doc.private) {
            for (var i in doc.private) {
              var field_name = doc.private[i];
              if (!ret.hasOwnProperty(field_name)) throw new Error("Private field not fount at the doc: " + field_name);
              delete ret[field_name];
            }
          }
          delete ret.__v;
          return ret;
        }
      };
      self.models[module.name] = module.model;
      self.models[module.name].prototype.graph = self;
    });

    return ret;
  }
}

module.exports = Graph;