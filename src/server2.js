'use strict';

const Hapi = require('hapi');
const fs = require("file-system");
//for parsing csv files which contains items
const csv = require("csv");
const file = fs.createReadStream('../public/items.csv');
const parseCsv = file.pipe(csv.parse());
//for making http request
const httprequest = require('request');

//For caching item id and description
const HashMap = require("hashmap");
var map = new HashMap();
var allItemIds = [];
var size = 1;
var num = 20;
var allItemFlag = false;

parseCsv.on('data', (row) => {
    allItemIds.push(row[0]);
});

const server = Hapi.server({
    port: 8000,
    host: 'localhost'
});
const init = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);

};
server.route({
    method: 'GET',
    path: '/items/{keyword}',
    config: {
      handler: async (request) => {
        //console.log(count);
        console.log("keyword ==="+request.params.keyword)
        var keyword = request.params.keyword;
        var result="";

        //populate hashmap on the first call
        if (map.size == 0){
            while(!allItemFlag) {
               getAndPopulateItemIds(function(){
                   result = filterBasedOnKeyword(keyword);
               });
            }

        } else {
             result = filterBasedOnKeyword(keyword);
        }
        console.log("final!!!"+result);
        return result;
      }
    }
  });

server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        return 'Walmart Test';
    }
});

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();


function getAndPopulateItemIds(callback) {
    var startItemNumber = (num * size) - size;
    var maxLimit = (num * size);
    var itemIds;
    if (allItemIds.length > startItemNumber) {
        if (allItemIds.length < maxLimit) {
            maxLimit = allIemIds.length;
            allItemFlag = true;
        }
        for (var i = startItemNumber; i < maxLimit; i++) {
            if (!itemIds) {
                itemIds = allItemIds[i];
            } else {
                itemIds += ","+allItemIds[i];
            }
        }
        console.log("itemIds ==="+itemIds);
        populateMap(itemIds);
        if (allItemFlag && callback) {
            callback();
        }
    }
}

function populateMap(itemIds) {
    httprequest('http://api.walmartlabs.com/v1/items?ids='+itemIds+'&format=json&apiKey=kjybrqfdgp3u4yv2qzcnjndj', function (error, response, body) {
       var body =  JSON.parse(body);
       var items = [];
       if (body != null && body.items != null ) {
           items = body.items;
       }
       for (var i=0; i <items.length; i++) {
           map.set(items[i].itemId, items[i].longDescription);
       }
    });
    return;
}

function filterBasedOnKeyword(keyword) {
  var result = "";
  map.forEach(function(value, key) {
      if(value.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
          if (!result) {
            result = key;
          } else {
            result += "," + key;
          }
      }
  });
  console.log("result : "+result);
  if (result) {
    return result;
  }
  return "No items matching the given keyword"
}