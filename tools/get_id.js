var get_id = function (obj_or_id) {
  if (!obj_or_id) return null;
  if (typeof(obj_or_id) == "object" && obj_or_id._id){
    return obj_or_id._id.toString();
  }
  return obj_or_id.toString();
};

module.exports = get_id;