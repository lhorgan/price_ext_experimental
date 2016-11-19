var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;

var mongoURL = 'mongodb://localhost:27017/test';
// Use connect method to connect to the Server
MongoClient.connect(mongoURL, function (err, db) {
    if(err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
    } 
    else {
        // Connection established
        console.log('Connection established to', mongoURL);

        // do some work here with the database.

        //Close connection
        db.close();
    }
});