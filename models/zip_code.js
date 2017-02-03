var mongoose = require('mongoose');
var perms = require('../db/perms');
var errors = require('../db/errors');
var foreach = require('../tools/foreach');
var sha1 = require('sha1');
var Promise = require("bluebird");


// var GeometrySchema = new mongoose.Schema({ set : [{type: String, trim: true}] })

var name = "ZipCode";
var fields = {
  zip: {
    type: String, // Can't be Number, cause there are 123XX and 123HH zips (for water and uninhabited terrain)
    default: ""
  },
  geometries: {
    type: [{ // list of geometries
      border_rings: {
        type: [{ // list of LinearRings, first is outer border, others are inner borders
          type: String,
          default: ""
        }],
        default: function () {
          return [];
        }
      }
    }],
    default: function () {
      return [];
    }
  },
  area: {
    type: Number,
    default: 0
  },
  perimeter: {
    type: Number,
    default: 0
  },
  population: {
    y_2010: { // Add other years same way
      type: Number,
      default: -1
    }
  },
  median_household_income: {
    y_2010: { // Add other years same way
      type: Number,
      default: -1
    }
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
