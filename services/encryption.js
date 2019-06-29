var bCrypt = require('bcrypt');
const saltRounds = 10;

/**
 * Hashes a password (as a parameter any kind of string could be used)
 */

async function GenerateHash(password)
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
 */

async function DoesPasswordMatch(password, password_hash)
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

module.exports.GenerateHash = GenerateHash;
module.exports.DoesPasswordMatch = DoesPasswordMatch;

