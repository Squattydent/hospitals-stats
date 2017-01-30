set -e  # Exit on any failure

cd frontend
./zbuild.sh

cd ..
git add -A
git commit -a
git push
