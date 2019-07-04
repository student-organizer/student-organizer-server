var mongoclient = require('mongodb').MongoClient;
var url = require('../config.json').mongodburl;
var cr = require('./chatroom.js');
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

            result.forEach(function(user)
            {
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

/**
 * Adds a chatroom to the database
 *
 * @param chatroom: chatroom object
 */
module.exports.createChatroom = function(chatroom)
{
    var dbo = client.db("studentorganizer");
    var myobj = {timestamp: chatroom.timestamp, members: chatroom.members, messages: chatroom.messages, name: chatroom.name, id: chatroom.id};
    dbo.collection("chatrooms").insertOne(myobj, function(err, res)
    {
        if (err) throw error;
        console.log("\x1b[32m%s\x1b[0m", "Chatroom" + "-" + chatroom.id + " has been created on the database.")
    });
}

/**
 * Gets chatroom data by given id
 *
 * @param chatroom_id: unique identifier for a chatroom
 * @returns chatroom object
 */
module.exports.getChatroom = async function(chatroom_id)
{
    return new Promise(function(resolve, reject)
    {
        var dbo = client.db("studentorganizer");
        var query = { id: chatroom_id };
        dbo.collection("chatrooms").find(query).toArray(function(err, result)
        {
            if (err) throw error;
            var ret = new cr.Chatroom(result[0].timestamp, result[0].members, result[0].messages, result[0].name, result[0].id);
            resolve(ret);
        });
    });
}

/**
 * Updates a chatroom on the database
 *
 * @param chatroom_id: unique identifier for a chatroom
 * @param chatroom_updated: chatroom object that is supposed to replace the old one
 */
module.exports.updateChatroom = function(chatroom_id, chatroom_updated)
{
    var dbo = client.db("studentorganizer");
    dbo.collection("chatrooms").updateOne
    (
        {"id": chatroom_id},
        {
            $set: {"members": chatroom_updated.members, "messages": chatroom_updated.messages, "name": chatroom_updated.name},
        }
    );
}

/**
 * Checks whether Chatroom with specific id already exists
 *
 * @param chatroom_id: unique identifier for a chatroom
 * @returns whether chatroom exists or not
 */
module.exports.isChatroomExisting = function(chatroom_id)
{
    return new Promise(function(resolve, reject)
    {
        var dbo = client.db("studentorganizer");
        var query = { id: chatroom_id };
        dbo.collection("chatrooms").find(query).toArray(function(err, result)
        {
            if (result == "") resolve(false);
            if (result != "") resolve(true);
        });
    });
}

/**
 * Creates a friendrequest
 *
 * @param requester: user who initiated the adding process
 * @param recipient: user who receives the friendrequest from the requester
 */
module.exports.createFriendrequest = function(id, requester, recipient)
{
    var dbo = client.db("studentorganizer");
    var myobj = {status: 'send', timestamp: Date.now(), requester: requester, recipient: recipient, id: id};
    dbo.collection("friendrequests").insertOne(myobj, function(err, res)
    {
        if (err) throw error;
        console.log("\x1b[32m%s\x1b[0m", "Friendrequest from " + requester + " towards " + recipient + " has been created on the database.")
    });
}

/**
 * Gets data from a friendrequest dataset
 *
 * @param friendrequest_id: unique identifier for each friendrequest
 * @returns status, requester and recipient from the friend request
 */
module.exports.getFriendrequestData = async function(friendrequest_id)
{
    return new Promise(function(resolve, reject)
    {
        var dbo = client.db("studentorganizer");
        var query = { id: friendrequest_id };
        dbo.collection("friendrequests").find(query).toArray(function(err, result)
        {
            if (err) throw error;

            var ret = { status: result[0].status, requester: result[0].requester, recipient: result[0].recipient };
            resolve(ret);
        });
    });
}

/**
 * Gets open friendrequests for user
 *
 * @param username: unique identifier for an user
 * @returns array of specific friendrequests
 */
module.exports.getFriendrequestsforUser = function(username)
{
    return new Promise(function(resolve, reject)
    {
        var dbo = client.db("studentorganizer");
        var query = { recipient: username };
        dbo.collection("friendrequests").find(query).toArray(function(err, result)
        {
            if (err) throw error;

            var ret = [];
            for (let i = 0; i < result.length; i++)
            {
                if (result[i].status == 'send')
                {
                    ret.push(result[i]);
                }
            }

            resolve(ret);
        });
    });
}

/**
 * Updates the status of a friendrequest
 *
 * @param friendrequest_id: unique identifier for each friendrequest
 * @param status: can be 'send' 'denied' or 'accepted'
 */
module.exports.updateFriendrequest = function(friendrequest_id, status)
{
    var dbo = client.db("studentorganizer");
    dbo.collection("friendrequests").updateOne
    (
        {"id": friendrequest_id},
        {
            $set: {"status": status},
        }
    );
}

/**
 * Checks whether a friendrequest was already set to one user or not
 *
 * @param friendrequest_id: unique identifier for each friendrequest
 * @returns whether friendrequest exists or not
 */
module.exports.isFriendrequestExisting = async function(friendrequest_id)
{
    return new Promise(function(resolve, reject)
    {
        var dbo = client.db("studentorganizer");
        var query = { id: friendrequest_id };
        dbo.collection("friendrequests").find(query).toArray(function(err, result)
        {
            if (result == "") resolve(false);
            if (result != "") resolve(true);
        });
    });
}













