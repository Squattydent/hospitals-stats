var foreach = require("../tools/foreach");

var ret = {};

ret.statuses_description = {
  400: "Bad Request",
  401: "Unauthorized",
  // 402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  // 407: "Proxy Authentication Required",
  408: "Request Timeout",
  // 409: "Conflict",
  // 410: "Gone",
  500: "Internal Server Error"
  // 411 Length Required
  // 412 Precondition Failed
  // 413 Request Entity Too Large
  // 414 Request-URI Too Large
  // 415 Unsupported Media Type
  // 416 Requested Range Not Satisfiable
  // 417 Expectation Failed
  // 422 Unprocessable Entity
  // 423 Locked
  // 424 Failed Dependency
  // 425 Unordered Collection
  // 426 Upgrade Required
  // 428 Precondition Required
  // 429 Too Many Requests
  // 431 Request Header Fields Too Large
  // 434 Requested host unavailable
  // 449 Retry With
  // 451 Unavailable For Legal Reasons
  // 501 Not Implemented
  // 502 Bad Gateway
  // 503 Service Unavailable
  // 504 Gateway Timeout
  // 505 HTTP Version Not Supported
  // 506 Variant Also Negotiates
  // 507 Insufficient Storage
  // 508 Loop Detected
  // 509 Bandwidth Limit Exceeded
  // 510 Not Extended
  // 511 Network Authentication Required
};

// Can make FOR, but inline allow IDE to show variants when typing ;)
ret["make400"] = function(msg){var ret = new Error(msg); ret.status=400; return ret};
ret["make401"] = function(msg){var ret = new Error(msg); ret.status=401; return ret};
ret["make403"] = function(msg){var ret = new Error(msg); ret.status=403; return ret};
ret["make404"] = function(msg){var ret = new Error(msg); ret.status=404; return ret};
ret["make405"] = function(msg){var ret = new Error(msg); ret.status=405; return ret};
ret["make406"] = function(msg){var ret = new Error(msg); ret.status=406; return ret};
ret["make408"] = function(msg){var ret = new Error(msg); ret.status=408; return ret};
ret["make500"] = function(msg){var ret = new Error(msg); ret.status=500; return ret};

module.exports = ret;
