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
var itemIds = "";
var allItemIds = [];
//The request can handle upto 20 ids and we have only 18 ids in the file
parseCsv.on('data', (row) => {
  allItemIds.push(row[0]);
  if (!itemIds) {
    itemIds = row[0];
  } else {
    itemIds += ","+row[0];
  }
});
const server = Hapi.server({
    port: 8000,
    host: 'localhost'
});
const init = async () => {
    await server.start();
    console.log(`Server running at: ${server.info.uri}`);

};

//route to get the product ids
server.route({
    method: 'GET',
    path: '/items/{keyword}',
    config: {
      handler: async function (request, reply) {
        console.log("keyword ==="+request.params.keyword);
        var keyword = request.params.keyword;
        var result = await filterBasedOnKeyword(keyword);
        console.log("final!!!"+result);
        return result

      }
    }
  });

//default route
server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        getIdsAndPopulate(0);
        return 'Walmart Test!! Go to /items/{your keyword} to get the product ids';
    }
});

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();


function getIdsAndPopulate(num, callback) {
    var size = 20;
    var itemIds = "";
    var maxLimit = (num+1 * size);
    if (allItemIds.length < maxLimit) {
        maxLimit = allItemIds.length;
    }
    for (var i=num;i<maxLimit;i++) {
        if (!itemIds) {
            itemIds = allItemIds[i];
          } else {
            itemIds += ","+allItemIds[i];
          }
    }
    console.log("itemIds=="+itemIds);
    populateMap(itemIds, function(){
        num = num + 20;
            if (num > allItemIds.length) {
                if (callback) {
                    callback();
                }
            } else {
                getIdsAndPopulate(num, callback);
            }
    });
}

function populateMap(itemIds, callback) {
    //console.log(itemIds);
    httprequest('http://api.walmartlabs.com/v1/items?ids='+itemIds+'&format=json&apiKey=kjybrqfdgp3u4yv2qzcnjndj', function (error, response, body) {
       var body =  JSON.parse(body);
       var items = [];
       if (body != null && body.items != null ) {
           items = body.items;
       }
       for (var i=0; i <items.length; i++) {
           map.set(items[i].itemId, items[i].longDescription);
       }
       if (callback){
        callback();
       }
    });
    return;
}

function filterBasedOnKeyword(keyword) {
  var result = "";

  map.forEach(function(value, key) {
      //console.log("hi");
      if(value.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
        //console.log("in");
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
  return "No items matching the given keyword";
}