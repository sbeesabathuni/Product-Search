# Pre-requisites
1. Run "npm install"
2. This will download all the dependencies required for the application to work.

# Product-Search
1. Start the server using: node src/final.js
2. Default url: http://localhost:3000/ should display the following message : "Walmart Test!! Go to /items/{your keyword} to get the product ids".
3. Keyword search: http://localhost:3000/items/{keyword}
4. The items.csv will be read in batches of 20 and an api call will be made to the product-api provided which will return product information. A hashmap would be populated with productId as key and description as value.
5. If we try to do product search without the hashmap being populated, it should return the following message "Please wait for the product information to be downloaded"
6. Else, a comma separated product id list would be displayed.
7. If there are no product ids with the given keyword, it should return the following message "No items matching the given keyword".

# Unit-Testing
1. Run "npm test"
2. This would run all the unit test cases written.
