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
        mongoclient.connect(url, {'useNewUrlParser': true}, function(err, client_new)
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

                resolve(client_new);
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
module.exports.createUser = function(username, password_hash)
{
    var dbo = client.db("studentorganizer");
    var myobj = {username: username, password: password_hash, friends: []};
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

            var ret = {user : result[0].username, pass: result[0].password, friends: result[0].friends };
            if (typeof ret.friends === 'undefined' || ret.friends == null)
                ret.friends = [];

            resolve(ret);
        });
    });
}

/**
 * Finds users based on a search query
 *
 * @param searchquery: self explanatory
 * @param user_toexclude: user to exclude from the list as he is the user making the request
 * @returns array of usernames from the users found
 */
module.exports.findUsers = function(searchquery, user_toexclude)
{
    return new Promise(function(resolve, reject)
    {
        var dbo = client.db("studentorganizer");
        dbo.collection("userdata").find({username: {$regex: searchquery}}).toArray(function(err, result)
        {
            var users = [];

            result.forEach(function(user){
                if (user.username === user_toexclude)
                    return;

                users.push(user.username);
            });

            resolve(users);
        });
    });
}

/**
 * Adds a friend to a specific user
 *
 * @param user: user who initiated the adding process
 * @param friend: user who gets added
 */
module.exports.addFriend = async function(user, friend)
{
    var dbo = client.db("studentorganizer");
    var userdata = await this.getUserData(user);
    var friends = userdata.friends;

    friends.push(friend);

    dbo.collection("userdata").updateOne
    (
        {"username": user},
        {
            $set: {"friends": friends},
        }
    );
}

/**
 * Removes a friend from a one's friendlist
 *
 * @param user: user who initiated the removal process
 * @param friend: friend of user who gets removed from user's friendlist
 * @constructor
 */
module.exports.removeFriend = async function(user, friend)
{
    var dbo = client.db("studentorganizer");
    var userdata = await this.getUserData(user);
    var friends = userdata.friends;
    var friends_new = [];

    friends.forEach(function(val)
    {
        if (val === friend)
            return;

        friends_new.push(val);
    });

    dbo.collection("userdata").updateOne
    (
        {"username": user},
        {
            $set: {"friends": friends_new},
        }
    );
}










