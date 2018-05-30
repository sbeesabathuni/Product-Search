const hapi = require( 'hapi');
const server = new hapi.Server();
//for parsing csv files which contains item ids
const csv = require("fast-csv");
const filePath = '/Users/sravya/Desktop/Walmart/public/items.csv';
const httprequest = require('request');

//For caching item id and description
const HashMap = require("hashmap");
server.map = new HashMap();

server.allItemIds = [];
server.downloaded = false;

//create connection
server.connection({
  host:'localhost',
  port: Number(3000)
})

//default route
server.route({
  method:'GET',
  path:'/',
  handler: function (req,res){
      return res('Walmart Test!! Go to /items/{your keyword} to get the product ids');

    }
})

//get product info based on ids
server.downloadBatched = function(ids) {
    const apiEndpoint = `http://api.walmartlabs.com/v1/items?ids=${ids}&format=json&apiKey=kjybrqfdgp3u4yv2qzcnjndj`;
    return new Promise(function(done, reject){
        httprequest.get(apiEndpoint,  (error, response, body) => {
            if(error) {
                reject();
            }
            done(JSON.parse(body));
        })
    });
}

//read itemIds from csv
server.readFromCsv = function(filePath) {
    server.allItemIds = [];
    return new Promise(function(done, reject){
        let csvstream = csv.fromPath(filePath)
            .on("data", function (row) {
               server.allItemIds.push(row);
            })
            .on("end", function () {
                done("csv is read!!");
            })
            .on("error", function (error) {
                reject(error);
            });
    });
}

//read itemIds from csv and populate hashmap for every 20 item ids
server.readCsvAndDownload = function(filePath, callback) {
    //First readCsv to get item ids
     server.readFromCsv(filePath).then((res)=> {
        //For every 20 itemIds make an api call
        for(var i = 0; i < server.allItemIds.length; i+=20) {
            // splice i --> i + 20 given max limit is 20
            var max = 0;;
            var ids="";
            if (i+20 < server.allItemIds) {
                max =  i+20;
            } else {
                max =  server.allItemIds.length;
            }
            for (var m= i; m<max; m++) {
                ids += server.allItemIds[m];
            }
            var idStr = ids.toString();
            //api call to get product information
            return server.downloadBatched(idStr)
                .then((body) => {
                    // keep on populating hashmap
                    //var body =  JSON.parse(body);
                    var items = [];
                    if (body != null && body.items != null ) {
                        items = body.items;
                    }
                    for (var i=0; i <items.length; i++) {
                        server.map.set(items[i].itemId, items[i].longDescription);
                    }
                    //end of ids indicated all products have been fetched
                    if(max >= server.allItemIds.length) {
                        // set global downloaded = true
                        server.downloaded = true;
                        if (callback) {
                            callback();
                        }
                    }
                })
                .catch(err => {
                    console.log(`Error occured ${err.message}`)
                });
        }
    });


};

//check in the hashmap and return the product ids
function _filterBasedOnKeyword(keyword) {
  var result = "";
  server.map.forEach(function(value, key) {
      if(value.toLowerCase().indexOf(keyword.toLowerCase()) > -1) {
          if (!result) {
            result = key;
          } else {
            result += "," + key;
          }
      }
  });
  if (result) {
    return result;
  }
  return "No items matching the given keyword";
}

//route to get the product ids
server.route({
    method: 'GET',
    path: '/items/{keyword}',
    config: {
      handler: function (request, reply) {
        if (!server.downloaded) {
            return reply("Please wait for the product information to be downloaded");
        }
        var keyword = request.params.keyword;
        var result = _filterBasedOnKeyword(keyword);
        return reply(result)

      }
    }
  });

server.start((err)=>{
  if (err) console.log('error while connecting :'+err)
  else console.log("Server started at localhost:3000");
})

server.readCsvAndDownload(filePath);

module.exports = server;

