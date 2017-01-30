function extractDataTableFromCSV(csv_data) { // TODO: make more flexible, probably use csv parser
  let ret = [];
  let lines = csv_data.split('\n');
  let state = 'waiting';
  for (var line_i in lines) {
    let line = lines[line_i];
    if (state === 'waiting' && line.indexOf('Zip Code;Discharges') === 0) {
      state = 'reading';
      continue;
    }
    if (state === 'reading') {
      if (line.trim().length === 0) {
        state = 'stopped';
        continue;
      }
      let line_arr = line.split(';');
      ret.push({zip: parseInt(line_arr[0]), discharges: parseInt(line_arr[1])});
    }
  }
  return ret;
}

module.exports = extractDataTableFromCSV;
