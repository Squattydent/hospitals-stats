var mongoose = require('mongoose');
var perms = require('../db/perms');
var errors = require('../db/errors');
var foreach = require('../tools/foreach');
var sha1 = require('sha1');
var Promise = require("bluebird");
var settings = require("../settings");
var check_ids_equal = require("../tools/check_ids_equal");


var name = "User";
var fields = {
  is_verified: {
    type: Boolean,
    default: false
  },
  is_superuser: {
    type: Boolean,
    default: false
  },
  is_staff: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    default: "",
    unique: true,
    required: true
  },
  verification: {
    code: {
      type: String,
      default: ""
    },
    timestamp: {
      type: Number,
      default: 0
    }
  },
  profile: {
    full_name: {
      type: String,
      default: ""
    },
    phone_number: {
      type: String,
      default: ""
    }
  },
  timestamp: {
    type: Number,
    default: function () {
      return Date.now()
    }
  }
};

var schema = new mongoose.Schema(fields);
var model = mongoose.model(name, schema);
model.prototype.private = ["verification"];
model.prototype.savable = ["profile"];

// Perms
function is_current_user(user, obj) {
  if (user._id.toString() != obj._id.toString()) throw errors.make403("Is not current user");
  return true;
}

var f = null;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// METHODS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
model.prototype.save_it = f = function (req) {
  return this.save();
};
f.perms = [perms.is_logged_in, perms.any(perms.is_superuser, is_current_user)];


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STATIC METHODS
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
model.get_current_user = f = function (req) {
  if (!req.user) return false;
  return req.user;
};
f.perms = [perms.everybody];

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
model.login = f = function (user_id, token, req) {
  return req.models.UserToken.findOne({user: user_id, value: token, is_active: true}).populate("user")
    .then(function (user_token) {
      if (!user_token) {
        return Promise.reject(errors.make404("UserToken not found"));
      }
      return user_token.user;
    });
};
f.perms = []; // This method is being called through "/" route processor on each call

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = {
  name: name,
  model: model,
  schema: schema
};
