const tinycolor = require('tinycolor2');

export default {
  props: ['show_zips_infos'],
  data: function () {
    return {
      color_levels: {},
      colors_by_zip_info_index: {},
      map: null,
      layer: null
    }
  },
  mounted: function () {
    console.log('Initializing the Map')
    this.map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 34.027, lng: -84.2995},
      zoom: 9
    });
    this.updateMap();
  },
  methods: {
    updateMap: function () {
      let max_value = this.show_zips_infos[this.show_zips_infos.reduce((prev_max_id, cur_item, cur_id) => {
        if (this.show_zips_infos[prev_max_id].value < this.show_zips_infos[cur_id].value) return cur_id;
        return prev_max_id;
      }, 0)].value;
      let min_value = this.show_zips_infos[this.show_zips_infos.reduce((prev_min_id, cur_item, cur_id) => {
        if (this.show_zips_infos[prev_min_id].value > this.show_zips_infos[cur_id].value) return cur_id;
        return prev_min_id;
      }, 0)].value;
      this.color_levels = {};
      let zips_by_color_levels = {};
      var zips = [];
      this.show_zips_infos.every((zip_info, id) => {
        let color_level = Math.floor((zip_info.value - min_value - 1) / max_value * 5);
        this.colors_by_zip_info_index[id] = tinycolor({
          h: 90 * color_level / (5 - 1),
          s: 0.8,
          l: 0.5
        }).toHexString();
        this.color_levels[color_level] = this.colors_by_zip_info_index[id]
        if (zips_by_color_levels[color_level] === undefined) zips_by_color_levels[color_level] = [];
        zips_by_color_levels[color_level].push(zip_info.zip);
        zips.push(zip_info.zip);
        return true;
      });
      if (this.map !== null) {
        var styles = [];
        Object.keys(zips_by_color_levels).forEach((color_level) => {
          styles.push({
            where: 'ZIP IN (' + zips_by_color_levels[color_level].join(',') + ')',
            polygonOptions: {
              fillColor: this.color_levels[color_level],
              fillOpacity: 0.5
            }
          });
          return true;
        });
        if (this.layer !== null) {
          this.layer.setMap(null);
          this.layer = null; //todo: destruct layer properly
        }
        this.layer = new google.maps.FusionTablesLayer({
          query: {
            select: 'geometry',
            from: '1Lae-86jeUDLmA6-8APDDqazlTOy1GsTXh28DAkw',
            where: 'ZIP IN (' + zips.join(',') + ')'
          },
          styles: styles
        });
        this.layer.setMap(this.map);
      }
    }
  },
  watch: {
    show_zips_infos: function(){
      this.updateMap();
    }
  }
}
