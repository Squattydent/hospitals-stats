var ret = {};
var default_env = {};
var default_env_text = "";

function get_env(key, default_value){
  if (!default_env.hasOwnProperty(key)){
    default_env[key] = default_value;
    if (default_env_text!="") default_env_text += "\n";
    default_env_text += key + "=" + default_value;
  }
  if (process.env.hasOwnProperty(key)){
    return process.env[key];
  }
  return default_value;
}

ret.DEBUG = get_env("DEBUG", "true")=="true";

// ADMINISTRATIVE
ret.HOME_URI = get_env("HOME_URI", 'http://127.0.0.1:5000/');
ret.EMAIL_FROM = get_env("EMAIL_FROM", 'local@sparkpostbox.com');
ret.VERIFICATION_SALT = get_env("VERIFICATION_SALT", 'VERIFICATION_SALT');

ret.SMS = {};
ret.SMS.MAX_CODE = 9999;
ret.SMS.REPEAT_SEC = 30;
ret.SMS.EXPIRATION_SEC = 30;

// AMAZON WEB SERVICES
ret.AWS = {};
ret.AWS.ACCESS_KEY_ID = get_env("AWS_ACCESS_KEY_ID", "NONE");
ret.AWS.SECRET_ACCESS_KEY = get_env("AWS_SECRET_ACCESS_KEY", "NONE");
ret.AWS.S3 = {};
ret.AWS.S3.BUCKET_NAME = get_env("S3_BUCKET_NAME", "NONE");

// HTTP
ret.HTTP = {};
ret.HTTP.PORT = parseInt(get_env("PORT", '') || get_env("HTTP_PORT", '5000'));

// DATABASES
ret.DB = {};

// MONGOOSE
ret.DB.MONGOOSE = {};
ret.DB.MONGOOSE.URI = get_env("DB_MONGOOSE_URI", 'mongodb://localhost/hospitals-stats');
ret.DB.MONGOOSE.POOL_SIZE = parseInt(get_env("DB_MONGOOSE_POOL_SIZE", '3'));

ret.PASSWORD_SALT = get_env("PASSWORD_SALT", 'PASSWORD_SALT');

// APPLICATION CLIENT
ret.CLIENT = {};
ret.CLIENT.SERVER_ROOT_URI = get_env("CLIENT_SERVER_ROOT_URI", 'http://127.0.0.1:5000/');
ret.CLIENT.MODELS_URI_PATH = get_env("CLIENT_MODELS_URI_PATH", 'models_api/{{model_name}}/{{call_type}}/{{method}}');

ret.default_env_text = default_env_text;
module.exports = ret;