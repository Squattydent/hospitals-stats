var mongoose = require('mongoose');
var perms = require('../db/perms');
var errors = require('../db/errors');
var foreach = require('../tools/foreach');
var sha1 = require('sha1');
var Promise = require("bluebird");


var name = "ZipCode";
var fields = {
  zip: {
    type: String, // Can't be Number, cause there are 123XX and 123HH zips (for water and uninhabited terrain)
    default: ""
  },
  geometry: {
    text: {
      type: String,
      default: ""
    }
  },
  population: {
    type: Number,
    default: 0
  },
  household_income: {
    type: Number,
    default: 0
  }
};

var schema = new mongoose.Schema(fields);
var model = mongoose.model(name, schema);
model.prototype.private = [];
model.prototype.savable = [];


var f = null;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// METHODS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STATIC METHODS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
model.query_zip_codes = f = function (zip_codes_list, req) {
  return req.models.ZipCode.find({zip: {$in: zip_codes_list}});
};
f.perms = [perms.everybody];


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
  name: name,
  model: model,
  schema: schema
};
