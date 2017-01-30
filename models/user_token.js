var mongoose = require('mongoose');
var sha1 = require('sha1');

var name = "UserToken";
var fields = {
  user: {
    type : mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  value: {
    type: String,
    default: function () {
      return sha1(Math.random());
    }
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  used: {
    type: Date,
    default: Date.now
  }
};

var schema = new mongoose.Schema(fields);
var model = mongoose.model(name, schema);

var f = null;
// Methods
// No public methods should be here

// Static Methods

module.exports = {
  name: name,
  model: model,
  schema: schema
};