var mongoclient = require('mongodb').MongoClient;
var url = require('../config.json').mongodburl;
var client = undefined;

/**
 * Connects to the MongoDB Database based on the connection string provided in the config
 */

function ConnectToDatabase_promise()
{
    return new Promise(function(resolve, reject)
    {
        mongoclient.connect(url, {'useNewUrlParser': true}, function(err, client)
        {
            if (err)
            {
                console.log("\x1b[32m%s\x1b[0m", "There was error while connecting to the database.");
				console.log(err);
            }
            else
            {
                if (typeof client === 'undefined')
                {
                    console.log("\x1b[32m%s\x1b[0m", "Successfully connected to the database.")
                }
                resolve(client);
            }
        });
    });
}

module.exports.ConnectToDatabase = async function()
{
    let connection = await ConnectToDatabase_promise();
    client = connection;
}

/**
 * Creates a user with parameters user and password_hash on the database
 *
 * @param username: plain text identifier for an account
 * @param password_hash: hashed password for an account
 */
module.exports.CreateUser = function(username, password_hash)
{
    var dbo = client.db("studentorganizer");
    var myobj = {username: username, password: password_hash};
    dbo.collection("userdata").insertOne(myobj, function(err, res)
    {
        if (err) throw error;
        console.log("\x1b[32m%s\x1b[0m", "Account with name " + username + " has been created on the database.")
    });
}

/**
 * Checks whether an user account already exists
 *
 * @param username: identifier to search in the database for an account
 * @returns whether user was already exists on the database
 */
module.exports.isUserExisting = function(username)
{
    return new Promise(function(resolve, reject)
    {
        var dbo = client.db("studentorganizer");
        var query = { username: username };
        dbo.collection("userdata").find(query).toArray(function(err, result)
        {
            if (result == "") resolve(false);
            if (result != "") resolve(true);
        });
    });
}

/**
 * Gets userdata by searching for the username in the database
 *
 * @param username: identifier to search in the database for an account
 * @returns an object with username and hashed password
 * @constructor
 */
module.exports.getUserData =  function(username)
{
    return new Promise(function(resolve, reject)
    {
        var dbo = client.db("studentorganizer");
        var query = { username: username };
        dbo.collection("userdata").find(query).toArray(function(err, result)
        {
            if (err) throw error;
            var ret = {user : result[0], pass: result[1] };
            resolve(ret);
        });
    });
}








