var express = require('express');
var path = require('path');
// var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var foreach = require('./tools/foreach');

var routes_models_api = require('./routes/models_api');
var routes_shortcuts = require('./routes/shortcuts');
var routes_migrations = require('./routes/migrations');
var routes_get_settings = require('./routes/get_settings');
var Graph = require('./db/graph');

function get_app(settings) {
  var app = express();
  app.settings = settings;
  app.graph = new Graph(app.settings);
  app.graph.register_all_models("./models/");

  // app.use(logger('dev'));

// CORS fix for hot reloading
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(cookieParser());

  //////// MIDDLEWARE
  app.use('/', function (req, res, next) {
    req.models = app.graph.models;
    req.user = null;
    if (!req.body.token_value || !req.body.user_id) {
      next();
    }
    else {
      req.models.User.login(req.body.user_id, req.body.token_value, req)
        .then(function (user) {
          req.user = user;
          next()
        })
        .catch(function (e) {
          next(e);
        });
    }
  });

  app.use('/get_settings', routes_get_settings);
  app.use('/models_api', routes_models_api);
  app.use('/migrations', routes_migrations);
  app.use('', routes_shortcuts);
  app.use(express.static(path.join(__dirname, './frontend/dist')));

  // catch 404 and forward to error handler
  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handlers

  // development error handler
  // will print stacktrace
  if (settings.DEBUG) {
    app.use(function (err, req, res, next) {
      console.log("Error:", err, "Status:", err.status);
      var status = err.status || 500;
      res.setHeader("err-message", err.message);
      res.status(err.status || 500);
      var status_str = "Error " + status;// + ": " + (errors.statuses_description[status] || "Unknown error");
      var rows = err.stack.split("\n");
      var rows_out = [];
      foreach(rows, function (i, row) {
        var row_out = row.replace("    ", "&nbsp;&nbsp;&nbsp; ");
        if (i != 0) row_out = "<small>" + row_out + "</small>";
        if (i != 0 && row_out.indexOf("node_modules") == -1) row_out = "<b style='color:red'>" + row_out + "</b>";
        rows_out.push(row_out);
      });
      res.send("<h1>" + status_str + "</h1><br>\n" + rows_out.join("<br>\n") + "");
    });
  }

  // production error handler
  // no stacktraces leaked to user
  app.use(function (err, req, res, next) {
    var status = err.status || 500;
    res.setHeader("err-message", err.message);
    res.status(err.status || 500);
    console.log(err.stack); // TODO: replace by better Logging
    var status_str = "Error " + status;// + ": " + (errors.statuses_description[status] || "Unknown error");
    res.send("<h1>" + status_str + "</h1><br>\n" + err.message);
  });
  return app;
}


module.exports = get_app;
