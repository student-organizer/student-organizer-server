var bCrypt = require('bcrypt');
const saltRounds = 10;

/**
 * Hashes a password
 *
 * @param password: any string to hash
 * @returns hash as string
 * @constructor
 */
module.exports.generateHash = function(password)
{
    return new Promise(function(resolve, reject)
    {
        bCrypt.hash(password, saltRounds, function(err, hash) {
            if (!err)
                resolve(hash);
        });
    });
}

/**
 * Checks if a plain password and a hash match
 *
 * @param password: plain text to compare with hash
 * @param password_hash: hashed plain text
 * @returns whether password_hash is the hashed version of password
 */
module.exports.doesPasswordMatch = function(password, password_hash)
{
    return new Promise(function (resolve, reject)
    {
        bCrypt.compare(password, password_hash, function (err, res)
        {
            if (err) resolve(err);
            resolve(res);
        });
    });
}

