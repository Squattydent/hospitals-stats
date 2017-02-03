'use strict';
var Graph = require('./db/graph');
var settings = require('./settings');
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var chunkingStreams = require('chunking-streams');

var XmlStream = require('xml-stream');
// var json = require('json');

// Create a file stream and pass it to XmlStream

let graph = new Graph(settings);
graph.register_all_models("./models/");

const zip_code_cache_filename = 'materials/zip_code_cache.json';

function pad(num, size) {
  var s = "000000000" + num;
  return s.substr(s.length - size);
}

function importZipCodes() {
  let queue = Promise.resolve();
  var zips = {};
  var zips_count = 0;

  queue = queue.then(function () {
    console.log('checking cache..')
    if (fs.existsSync(zip_code_cache_filename)) {
      console.log('reading from cache..');
      zips = JSON.parse(fs.readFileSync(zip_code_cache_filename));
      zips_count = Object.keys(zips).length;
      console.log('Loaded:', zips_count, zips['356HH']);
      return Promise.resolve();
    }
    console.log('no cache, parsing xml data..')
    var input = fs.createReadStream(path.join(__dirname, 'materials/2015_zips_boundaries.kml')); // TODO: total is 51042 zips (starting from 1)
    var xml = new XmlStream(input);

    var i = 0;
    xml.on('updateElement: Placemark', function (item) {
      // console.log(JSON.stringify(item));
      // return true;
      i += 1;
      if (i % 1000 === 0) console.log(i);
      if (item.MultiGeometry) {
        if (item.Polygon || !item.MultiGeometry.Polygon) {
          console.log("WARN!", item)
        }
        item.Polygon = item.MultiGeometry.Polygon;
      }

      let zip = item.description.split('<th>ZCTA5CE10</th> <td>')[1].split('</td>')[0];
      // console.log(zip);
      // if (zip != '08204') return false;
      if (!zips.hasOwnProperty(zip)) {
        zips[zip] = {
          zip: zip,
          area: 0,
          perimeter: 0,
          geometries: [],
          population: {},
          median_household_income: {}
        };
        zips_count += 1;
      }
      // let area = parseFloat(item.description.split('<br />')[0].split('AREA:')[1].split('<i>')[1].split('</i>')[0]);
      // let perimeter = parseFloat(item.description.split('<br />')[1].split('PERIMETER:')[1].split('<i>')[1].split('</i>')[0]);
      //
      // zips[zip].area += area;
      // zips[zip].perimeter += perimeter;

      let geom = {inner: []};
      for (let polygon_key in item.Polygon) {
        if (polygon_key == '$name' || polygon_key == 'extrude' || polygon_key == 'tessellate' || polygon_key == 'altitudeMode') {
          continue
        }
        if (polygon_key == 'outerBoundaryIs' || polygon_key == 'innerBoundaryIs') {
          if (!item.Polygon[polygon_key].hasOwnProperty('LinearRing') || !item.Polygon[polygon_key].LinearRing.hasOwnProperty('coordinates')) {
            console.error('Error: Not Linear ring inside geometry or no coordinates inside:', item.Polygon[polygon_key])
          }
          let coords_pairs_str = item.Polygon[polygon_key].LinearRing.coordinates.split(' ').map(function (pair_str) {
            return pair_str.split(',').map(function (coord) {
              return Math.round(coord * 1000000) / 1000000;
            }).join(',');
          }).join(' ');
          if (polygon_key == 'outerBoundaryIs') {
            if (geom.hasOwnProperty('outer')) {
              console.error('Error: geom already have outer boundary:', item.Polygon);
            }
            geom.outer = coords_pairs_str;
          }
          if (polygon_key == 'innerBoundaryIs') {
            geom.inner.push(coords_pairs_str);
          }
          continue
        }
        console.error('Error: polygon key bad format:', polygon_key, item.Polygon);
      }
      zips[zip].geometries.push({border_rings: [geom.outer].concat(geom.inner)});
      // console.log()
      // console.log(zips[zip].geometries[0]);
      return true;

    });


    return new Promise(function (resolve, reject) {
      xml.on('end', function () {
        console.log('Preprocessed rows:', i);
        fs.writeFileSync(zip_code_cache_filename, JSON.stringify(zips));
        resolve();
      });
    })
  });


  // Enriching zips with population 2010
  var population_stream = fs.createReadStream(path.join(__dirname, 'materials/2010_census_populatioby_zips.csv')); // TODO: total is 51042 zips (starting from 1)
  var population_chunker = new chunkingStreams.LineCounter({
    flushTail: true // use last line as chunk also
  });
  let pop_i = 0;
  let good_pop = 0;
  let bad_pop = 0;
  let bad_pop_acc = 0;
  let total_pop_acc = 0;
  population_chunker.on('data', function (chunk_buf) {
    let chunk_str = chunk_buf.toString('utf8');
    if (chunk_str.indexOf('Zip Code') !== -1) return true;
    pop_i += 1;
    if (pop_i % 1000 === 0) console.log('Enriching with Population 2010:', pop_i);
    let pair = chunk_str.split(',');
    let zip = pair[0];
    let population_str = pair[1];
    total_pop_acc += parseInt(population_str);
    if (!zips.hasOwnProperty(zip)) {
      console.error('Zip not found!', zip, parseInt(population_str));
      bad_pop += 1;
      bad_pop_acc += parseInt(population_str);
      return true;
    }
    good_pop += 1;
    zips[zip].population.y_2010 = parseInt(population_str);
  });
  queue = queue.then(function () {
    return new Promise(function (resolve, reject) {
      population_stream.pipe(population_chunker);
      population_chunker.on('end', resolve);
    })
  });
  queue = queue.then(function () {
    console.log('Not found zips count for Population 2010:', bad_pop, good_pop, 'Covered zips ratio:', Math.round(good_pop / zips_count * 100 * 100) / 100, 'Not found value ratio', Math.round(bad_pop_acc / total_pop_acc * 100 * 100) / 100);
  });


  // Enriching zips with household income 2010
  var median_household_income_stream = fs.createReadStream(path.join(__dirname, 'materials/2010_median_household_income_by_zips.csv')); // TODO: total is 51042 zips (starting from 1)
  var median_household_income_chunker = new chunkingStreams.LineCounter({
    flushTail: true // use last line as chunk also
  });
  let mhi_i = 0;
  let good_mhi = 0;
  let bad_mhi = 0;
  let bad_mhi_acc = 0;
  let total_mhi_acc = 0;
  median_household_income_chunker.on('data', function (chunk_buf) {
    let chunk_str = chunk_buf.toString('utf8');
    if (chunk_str.indexOf('Zip') !== -1) return true;
    mhi_i += 1;
    if (mhi_i % 1000 === 0) console.log('Enriching with median_household_income 2010:', mhi_i);
    let pair = chunk_str.split(',');
    let zip = pad(pair[0], 5);
    let median_household_income_str = pair[1];
    total_mhi_acc += parseInt(median_household_income_str);
    if (!zips.hasOwnProperty(zip)) {
      console.error('Zip not found!', zip, parseInt(median_household_income_str));
      bad_mhi += 1;
      bad_mhi_acc += parseInt(median_household_income_str);
      return true;
    }
    good_mhi += 1;
    zips[zip].median_household_income.y_2010 = parseInt(median_household_income_str);
  });
  queue = queue.then(function () {
    return new Promise(function (resolve, reject) {
      median_household_income_stream.pipe(median_household_income_chunker);
      median_household_income_chunker.on('end', resolve);
    })
  });
  queue = queue.then(function () {
    console.log('Not found zips count for median_household_income 2010:', bad_mhi, good_mhi, 'Covered zips ratio:', Math.round(good_mhi / zips_count * 100 * 100) / 100, 'Not found value ratio', Math.round(bad_mhi_acc / total_mhi_acc * 100 * 100) / 100);
  });


  var processed = 0;
  var added = 0;
  queue = queue.then(function () {
    let awaiting = [];
    // var zips_keys = Object.keys(zips);
    for (let zip_key in zips) {
      if (!zips.hasOwnProperty(zip_key)) continue;
      // let zip_key = zip_key_i;
      awaiting.push(graph.models.ZipCode.findOne({zip: zip_key}).then(function (zip_code) {
        processed += 1;
        if (processed % 1000 === 0) console.log('Saving:', processed);
        // console.log(zip_code);
        // console.log(zips[zip_key]);
        if (zip_code === null) {
          zip_code = new graph.models.ZipCode();
          zip_code.zip = zip_key;
          added += 1;
        }
        zip_code.area = zips[zip_key].area;
        zip_code.perimeter = zips[zip_key].perimeter;
        zip_code.geometries = zips[zip_key].geometries;
        // console.log('Saving:', zip_code)
        for (let pop_k in zips[zip_key].population) {
          zip_code.population[pop_k] = zips[zip_key].population[pop_k];
        }
        for (let mhi in zips[zip_key].median_household_income) {
          zip_code.median_household_income[mhi] = zips[zip_key].median_household_income[mhi];
        }
        return zip_code.save();
      }));
    }
    return Promise.all(awaiting);
  });
  queue = queue.then(function () {
    graph.models.ZipCode.find().then(function (ret) {
      console.log('Total zips at DB after saving:', ret.length, 'Processed:', processed, 'Added:', added);
      process.exit();
    });
  });
}

importZipCodes();
