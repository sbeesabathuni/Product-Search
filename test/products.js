const assert = require('chai').assert;
const server = require('../src/final.js')
const filePath = '/Users/sravya/Desktop/Walmart/public/items.csv';
const HashMap = require("hashmap");
var hmap = new HashMap();

server.register([{
    register: require('inject-then')
}])

describe('Testing Product API', function () {
    it('should validate if server is running', function () {
        return server.injectThen({
                method: 'GET',
                url: '/'
            })
            .then(
                function (response) {
                    //console.log(response);
                    assert.deepEqual(response.statusCode, 200);
                    assert.equal(response.result, 'Walmart Test!! Go to /items/{your keyword} to get the product ids');
                }
            )
    });

    //test read from csv
    it('should should read ids from csv', function () {
        return server.readFromCsv(filePath)
            .then(
                function (response) {
                   assert.equal(response, 'csv is read!!');
                   assert.equal(server.allItemIds.length, 18);
                }
            )
    });

    //test api call
    it('test product api call', function () {
        return server.downloadBatched("14225185,14225186")
            .then(
                function (response) {
                   assert.equal(response.items.length, 2);
                   assert.equal(response.items[0].itemId, 14225185);
                   assert.equal(response.items[1].itemId, 14225186);
                }
            )
    });

    //check whether hashmap has been populated after retrieving product ids from csv
    it('validate hashmap', function () {
        assert.equal(server.downloaded, false);
        server.readCsvAndDownload(filePath, function(){
            assert.equal(server.map.size, 18);
            assert.equal(server.downloaded, true);
            hmap = server.map;
        });
    });

    //final product api with keyword backpack
    it('check product api when values are not cached in hashmap', function () {
        server.downloaded = false
        return server.injectThen({
                method: 'GET',
                url: '/items/backpack'
            })
            .then(
                function (response) {
                    assert.deepEqual(response.statusCode, 200);
                    assert.equal(response.result, 'Please wait for the product information to be downloaded');
                }
            )
    });

    //final product api with keyword backpack
    it('product api test with keyword backpack', function () {
        setTimeout(function(){
           server.downloaded = true;
           server.map = hmap;
           return server.injectThen({
               method: 'GET',
               url: '/items/backpack'
           })
           .then(
               function (response) {
                   console.log(response.result);
                   assert.deepEqual(response.statusCode, 200);
                   assert.equal(response.result, '23117408,35613901,35813552');
               }
           )
        }, 5000);
    });

    //final product api with keyword bag
        it('product api test with keyword bag', function () {
            setTimeout(function(){
               server.downloaded = true;
               server.map = hmap;
               return server.injectThen({
                   method: 'GET',
                   url: '/items/bag'
               })
               .then(
                   function (response) {
                       assert.deepEqual(response.statusCode, 200);
                       assert.equal(response.result, 'No items matching the given keyword');
                   }
               )
            }, 5000);
        });


});