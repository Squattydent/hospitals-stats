# hospitals-stats-backend

> A back-end part of Hospitals stats proj


Updating ZIPs DB:
1. download KML file from https://www.census.gov/geo/maps-data/data/kml/kml_zcta.html to ./materials folder (see filename at the script
2. add 2010 population and household income csv files (zip,value,..) same way
3. run import_zips_codes on local
4. run mongodump -d hospitals-stats
5. run mongorestore -h ds137759.mlab.com:37759 -d heroku_2hhvs8mv -u heroku_2hhvs8mv -p 5re58u01iiblpbiihdho9175t7 dump/hospitals-stats/
