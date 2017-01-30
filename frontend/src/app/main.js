const debounce = require('debounce');
const extractDataTableFromCSV = require('./tools/extract_data_table_from_csv');
const sub_zips_mapping = require('./sub_zips_mapping');
let sample_data = require('./sample_data');

export default {
  components: {
    'colored-map': require('./components/colored_map/main.vue')
  },
  name: 'app',
  data: function () {
    return {
      csv_data: sample_data,
      data_table: [],
      options_list: [],
      selected_option_index: null,
      current_tab: 'input-csv'
    }
  },
  mounted: function () {
    this.processCsvData()
  },
  methods: {
    processCsvData: function () {
      this.data_table = extractDataTableFromCSV(this.csv_data);
      this.data_table.sort(function (a, b) {
        return b.discharges - a.discharges
      });
      let total_discharges = this.data_table.reduce(function (prev_val, cur_item) {
        return prev_val + cur_item.discharges;
      }, 0);
      console.log('Total discharges:', total_discharges);
      let last_good_discharges_acc = 0;
      let discharges_percentage_acc = 0;
      let options_list = [];
      for (let row_i in this.data_table) {
        let row = this.data_table[row_i];
        row.value = row.discharges; // For displaying in more uniform way
        if (sub_zips_mapping[row.zip.toString()] !== undefined) {
          console.log('Updating sub ZIP:', row.zip, sub_zips_mapping[row.zip.toString()]);
          row.zip = sub_zips_mapping[row.zip.toString()]
        }
        row.discharges_percentage = row.discharges * 100.0 / total_discharges;
        discharges_percentage_acc += row.discharges_percentage;
        row.discharges_percentage_acc = discharges_percentage_acc;
        row.include_to_top = discharges_percentage_acc < 75.0;
        if (row.include_to_top) {
          last_good_discharges_acc = discharges_percentage_acc;
        } else {
          if (last_good_discharges_acc + row.discharges_percentage >= 75.0) {
            options_list.push(row);
            let new_row = options_list[options_list.length - 1];
          }
        }
      }
      this.selected_option_index = null;
      this.options_list = options_list;
    },
    switchTab: function (tab_name) {
      this.current_tab = tab_name;
    }
  },
  watch: {
    csv_data: debounce(function () {
      this.processCsvData()
    }, 300),
    selected_option_index: function () {
      for (let option_i in this.options_list) {
        this.options_list[option_i].include_to_top = (parseInt(option_i) === parseInt(this.selected_option_index))
      }
    }
  }
}
