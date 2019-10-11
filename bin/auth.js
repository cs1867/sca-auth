#!/usr/bin/env node
'use strict';

///////////////////////////////////////////////////////////////////////////////////////////////////
//
// Update specified user's scope 
//

var config = require('../api/config');

//contrib
var argv = require('optimist').argv;
var winston = require('winston');
var jwt = require('jsonwebtoken');
var fs = require('fs');
var _ = require('underscore');
const readlineSync = require('readline-sync');

var logger = new winston.Logger(config.logger.winston);
var db = require('../api/models');

const shortListCols = [ "id", "active", "username", "email", "fullname" ];

switch(argv._[0]) {
    case "modscope": modscope(); break;
    case "listuser": listuser(); break;
    case "issue": issue(); break;
    case "setpass": setpass(); break;
    case "useradd": useradd(); break;
    case "userdel": userdel(); break;
    default:
        console.log(fs.readFileSync(__dirname+"/usage.txt", {encoding: "utf8"})); 
        break;
}

function listuser() {
    db.User.findAll({/*attributes: ['id', 'username', 'email', 'active', 'scopes', 'times', 'createdAt'],*/ raw: true})
    .then(function(users) {
            var compact = argv.compact;
            if ( ! argv.short ) {
                if ( !compact ) {
                    console.log( JSON.stringify( users, null, "   " ) );
                } else {
                    console.log( JSON.stringify( users ) );
                }
            } else {
                console.log( shortListCols.join("\t") );
                _.map(users, function(user) {
                    var row = [];
                    _.each( shortListCols, function(col) {
                        row.push(user[col]);
                    });
                    console.log(row.join("\t"));
                });
            }
        }); 
    }

    function issue() {
        if(!argv.scopes || argv.sub === undefined) {

            logger.error("pwa_auth issue --scopes '{common: [\"user\"]}' --sub 'my_service' [--exp 1514764800]  [--out token.jwt] [--key test.key]");
            process.exit(1);
        }

        var claim = {
            "iss": config.auth.iss,
            "iat": (Date.now())/1000,
            "sub": argv.sub,
        };
        if(argv.scopes) {
            claim.scopes = JSON.parse(argv.scopes);
        }
        if(argv.profile) {
            claim.profile = JSON.parse(argv.profile);
        }

        if(argv.exp) {
            claim.exp = argv.exp;
        }
        if(argv.key) {
            console.log("using specified private key");
            config.auth.private_key = fs.readFileSync(argv.key);
        }
        /*
        if(argv.pub) {
            console.log("using specified public key");
            config.auth.public_key = fs.readFileSync(argv.pub);
            //console.dir(config.auth);
        }
        */

        var token = jwt.sign(claim, config.auth.private_key, config.auth.sign_opt);
        if(argv.out) {
            fs.writeFileSync(argv.out, token);
        } else {
            console.log(token);
        }

        /*
        //verify to check
        jwt.verify(token, config.auth.public_key, function(err, decoded) {
            if(err) throw err;
            console.log("decoded:");
            console.log(JSON.stringify(decoded, null, 4));
        });
        */
    }

    function modscope() {
        if(!argv.username && !argv.id) {
            logger.error("please specify --username <username> (or --id <userid>) --set/add/del '{{common: [\"user\", \"admin\"]}}'");
            process.exit(1);
        }

        function add(base, sub) {
            if(sub.constructor == Array) {
                sub.forEach(function(item) {
                    if(!~base.indexOf(item)) base.push(item);
                });
            } else {
                for(var k in sub) {
                    if(base[k] === undefined) base[k] = sub[k];
                    else add(base[k], sub[k]);
                }
            }
            return base;
        }

        function del(base, sub) {
            if(typeof sub == 'object' && sub.constructor == Array) {
                sub.forEach(function(item) {
                    var pos = base.indexOf(item);
                    if(~pos) base.splice(pos, 1);
                });
            } else if(typeof sub == 'object') {
                for(var k in sub) {
                    if(base[k] !== undefined) del(base[k], sub[k]);
                }
            }
            return base;
        }

        db.User.findOne({where: { 
            $or: [
                {username: argv.username}, 
                {id: argv.id}, 
            ]} 
        }).then(function(user) {
            if(!user) return logger.error("can't find user:"+argv.username);
            if(argv.set) {
                user.scopes = JSON.parse(argv.set);
            }
            if(argv.add) {
                user.scopes = add(_.clone(user.scopes), JSON.parse(argv.add));
            }
            if(argv.del) {
                user.scopes = del(_.clone(user.scopes), JSON.parse(argv.del));
            }
            user.save().then(function() {
                logger.info("successfully updated user scope. user must re-login for it to take effect)");
            }).catch(function(err) {
                logger.error(err);
            });
        })
    }

    function setpass() {
        console.log("argv", argv);
        if(!argv.username && !argv.id) {
            logger.error("please specify --username <username> or --id <userid>");
            process.exit(1);
        }
        if(!argv.password) {
            logger.error("please specify --password <password>");
            process.exit(1);
        }

        db.User.findOne({where: {
            $or: [
                {username: argv.username},
                {id: argv.id},
            ]}
        }).then(function(user) {
            if(!user) return logger.error("can't find user:"+argv.username);
            var newPassword = argv.password;
            if ( newPassword === true ) {
                var confirmPassword;
                while (confirmPassword != newPassword ) {
                    newPassword = readlineSync.question('Please enter new password: ', {
                        hideEchoBack: true // The typed text on screen is hidden by `*` (default).
                    });
                    confirmPassword = readlineSync.question('Please confirm new password: ', {
                        hideEchoBack: true // The typed text on screen is hidden by `*` (default).
                    });
                    if ( newPassword != confirmPassword ) {
                        console.log("passwords don't match; try again");
                    }
                }
                if ( newPassword == confirmPassword && newPassword != "" ) {
                    console.log("updating password");
                } else {
                    return logger.error("error updating password for user "+user.username + "; password must not be empty.");

                }

            }

            user.setPassword(newPassword, function(err) {
                if(err) throw err;
                user.save().then(function() {
                    logger.log("successfully updated password");
                }).catch(function(err) {
                    logger.error(err);
                });
            });
        })
    }

    function useradd() {
        if(!argv.username) {
            logger.error("please specify --username <username>");
            process.exit(1);
        }
        if(!argv.fullname) {
            logger.error("please specify --fullname <fullname>");
            process.exit(1);
        }
        if(!argv.email) {
            logger.error("please specify --email <fullname>");
            process.exit(1);
        }

        // Check whether username/email already exist
        // Theoretically sequelize should prevent dupes, but that constraint is
        // not working
        var userExists = false;
        db.User.findOne({where: { 
            $or: [
                {username: argv.username}, 
                {email: argv.email}, 
            ]} 
        }).then(function(user) {        
            if ( user ) userExists = true;

            if ( userExists ) {
                logger.error("username and email must be unique");
                process.exit(1);
            }

            var user = db.User.build(
                //extend from default
                Object.assign({
                    username: argv.username,
                    fullname: argv.fullname,
                    email: argv.email,
                    email_confirmed: true,
                }, config.auth.default)
                );
            user.save().then(function(_user) {
                if(!_user) return logger.error("couldn't register new user");
                logger.info("successfully created a user");
                if(argv.password) setpass();
                else logger.info("you might want to reset password / setscope");
            });
        });
    }

    function userdel() {
        if(!argv.username && !argv.id) {
            logger.error("please specify --username <username> or --id <userid>");
            process.exit(1);
        }

        //TODO - does this cascade to group?
        db.User.destroy({
            where: { $or: [
                {username: argv.username}, 
                {id: argv.id}, 
            ]} 
        }).then(function(count) {
            if(count == 1) logger.info("successfully removed user");
            else logger.info("failed to remove user - maybe doesn't exist?")
        });
    }


