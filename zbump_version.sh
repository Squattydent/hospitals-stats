set -e  # Exit on any failure
cd version

version=$(< version.txt)
version_arr=(${version//./ })
version_major=${version_arr[1]}
version_minor=${version_arr[2]}
version_hotfix=${version_arr[3]}
version_build=${version_arr[4]}

echo "Bumping $1 version"


case "$1" in
    major)
        version_major=`expr $version_major + 1`
        version_minor=0
        version_hotfix=0
        ;;
    minor)
        version_minor=`expr $version_minor + 1`
        version_hotfix=0
        ;;
    hotfix)
        version_hotfix=`expr $version_hotfix + 1`
        ;;
    build)
        version_build=`expr $version_build + 1`
        ;;
esac

printf "ver.$version_major.$version_minor.$version_hotfix.$version_build" > version.txt

cat version.txt > version_full.txt

now="$(date +'%d/%m/%Y, %T')"
printf ", built on $now" >> version_full.txt

version_full=$(< version_full.txt)
echo "New version: $version_full"

md5 -q version_full.txt > version_hash.txt

cd ..
sed "s/\"version\": \".*\"/\"version\": \"$version_major.$version_minor.$version_hotfix\"/g" package.json > package.json.tmp ; mv package.json.tmp package.json
sed "s/\"build\": \".*\"/\"build\": \"$version_build\"/g" package.json > package.json.tmp ; mv package.json.tmp package.json