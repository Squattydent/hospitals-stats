var get_id = require("./get_id");

var check_ids_equal = function (obj_or_id_1, obj_or_id_2) {
  return get_id(obj_or_id_1) == get_id(obj_or_id_2);
};

module.exports = check_ids_equal;