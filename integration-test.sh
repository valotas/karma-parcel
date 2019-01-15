#/bin/bash +X

integration_dir=/tmp/karma-parcel-integration

rm -rf $integration_dir
mkdir -p $integration_dir
cp -r ./integration-pkg/* $integration_dir
curr_dir=`pwd`
find $integration_dir -type f -exec sed -i 's@__KARMA_PARCEL__@'"$curr_dir"'@' {} ';'

cd $integration_dir
npm i
npm t
