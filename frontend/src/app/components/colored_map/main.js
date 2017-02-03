const tinycolor = require('tinycolor2');

function get_points_arr_center(arr_of_points) {
  let ret = {lng: 0, lat: 0};
  arr_of_points.forEach((pair) => {
    ret.lng += pair.lng;
    ret.lat += pair.lat;
  });
  ret.lng /= arr_of_points.length;
  ret.lat /= arr_of_points.length;
  return ret;
}

function convert_ring_coords_to_arr(coords) {
  var pairs = coords.split(' ');
  var ret = [];
  for (var pair_i in pairs) {
    var t_pair = pairs[pair_i].split(',');
    var ret_pair = {
      lng: parseFloat(t_pair[0]),
      lat: parseFloat(t_pair[1])
    }
    ret.push(ret_pair);
  }
  return ret;
}

function convert_geom_to_arr_of_arr(geom) {
  return geom.border_rings.map(function (ring_coords) {
    return convert_ring_coords_to_arr(ring_coords)
  })
}

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default {
  props: ['zips_infos'],
  data: function () {
    return {
      color_levels: {},
      colors_by_zip_info_index: {},
      map: null,
      layer: null,
      features: [],
      markers: [],
    }
  },
  mounted: function () {
    console.log('Initializing the Map')
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 34.027, lng: -84.2995},
      zoom: 10
    });
    var infowindow = new google.maps.InfoWindow()
    this.map.data.addListener('click', (event) => {
      let zip_obj = event.feature.getProperty('zip_obj');
      infowindow.setContent(
        '<b>ZIP: ' + zip_obj.zip + '</b><br/><i>Population (2010):</i> <b>' + zip_obj.population.y_2010 + '</b></br>' +
        '<i>Median Household Income (2010):</i> <b>$' + numberWithCommas(zip_obj.median_household_income.y_2010) + '</b></br>' +
        '<i>Discharges:</i> <b>' + this.get_zip_info_by_zip(zip_obj.zip).value + '</b>'
      );
      infowindow.setPosition(event.latLng);
      infowindow.open(this.map)
    });
    this.updateMap();
  },
  methods: {
    get_zip_info_by_zip: function (zip) {
      var found = this.zips_infos.filter((zip_info)=> {
        return zip_info.zip === zip
      });
      if (found.length == 0) {
        return null;
      }
      return found[0]
    },
    updateMap: function () {
      let max_value = this.zips_infos[this.zips_infos.reduce((prev_max_id, cur_item, cur_id) => {
        if (this.zips_infos[prev_max_id].value < this.zips_infos[cur_id].value) return cur_id;
        return prev_max_id;
      }, 0)].value;
      let min_value = this.zips_infos[this.zips_infos.reduce((prev_min_id, cur_item, cur_id) => {
        if (this.zips_infos[prev_min_id].value > this.zips_infos[cur_id].value) return cur_id;
        return prev_min_id;
      }, 0)].value;
      var zips = [];
      this.zips_infos.forEach((zip_info, id) => {
        let color_level = Math.floor((zip_info.value - min_value - 1) / max_value * 5);
        this.$set(this.colors_by_zip_info_index, id, tinycolor({ // TODO: Dig why Vue can't update it through observers
          h: 90 * color_level / (5 - 1),
          s: 0.8,
          l: 0.5
        }).toHexString());
        zips.push(zip_info.zip);
        return true;
      });
      if (this.map !== null) {
        var styles = [];
        this.map.data.setStyle(
          (feature)=> {
            return {
              clickable: 'true',
              strokeWeight: 0.25,
              strokeColor: 'gray',
              fillColor: this.colors_by_zip_info_index[this.zips_infos.indexOf(this.get_zip_info_by_zip(feature.getProperty('zip_obj').zip))]
            }
          });

        window.backend_graph_api_client.models.ZipCode.query_zip_codes(zips).then((zip_codes) => {
          this.features.forEach((feature) => {
            this.map.data.remove(feature);
          })
          this.features = [];
          this.markers.forEach((marker) => {
            marker.setMap(null);
          })
          this.markers = [];

          let markers_centers = [];
          for (let zip_code_i in zip_codes) {
            let zip_code = zip_codes[zip_code_i];
            for (let geom_i in zip_code.geometries) {
              this.features.push(this.map.data.add({
                geometry: new google.maps.Data.Polygon(convert_geom_to_arr_of_arr(zip_code.geometries[geom_i])),
                properties: {zip_obj: zip_code}
              }));
            }
            let marker_center = get_points_arr_center(zip_code.geometries.map((geom)=> {
              return get_points_arr_center(convert_geom_to_arr_of_arr(geom)[0]);
            }));
            let marker = new google.maps.Marker({
              position: marker_center,
              map: this.map,
              label: {
                color: 'gray',
                fontWeight: '100',
                fontSize: '12px',
                text: zip_code.zip,
              },
              icon: {
                // labelOrigin: new google.maps.Point(11, 50),
                url: 'none',
                // size: new google.maps.Size(22, 40),
                // origin: new google.maps.Point(0, 0),
                // anchor: new google.maps.Point(11, 40),
              }
            });
            marker.setClickable(false);
            this.markers.push(marker);
            markers_centers.push(marker_center);
          }

          this.map.setCenter(get_points_arr_center(markers_centers));

        })

      }
    }
  },
  watch: {
    zips_infos: function () {
      this.updateMap();
    }
  }
}
