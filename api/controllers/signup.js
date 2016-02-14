
//contrib
var express = require('express');
var router = express.Router();
var common = require('../common');
var winston = require('winston');

//mine
var config = require('../config');
var logger = new winston.Logger(config.logger.winston);
var db = require('../models');

function registerUser(body, done) {
    var user = db.User.build({
        username: body.username, 
        fullname: body.fullname, 
        email: body.email,
        scopes: config.auth.default_scopes
    });
    logger.info("registering user");
    user.setPassword(body.password, function(err) {
        if(err) return done(err);
        logger.debug("set password done");
        user.save().then(done);
    });
}

router.post('/', function(req, res, next) {
    var username = req.body.username;
    var email = req.body.email;

    //TODO - validate password strength? (req.body.password)
    //check for username already taken
    db.User.findOne({where: {username: username} }).then(function(user) {
        if(user) {
            //TODO - maybe I should go ahead and forward user to login form?
            return next('The username you chose is already registered. If it is yours, please try signing in, or register with a different username.');
        } else {
            //check for email already taken
            db.User.findOne({where: {email: email} }).then(function(user) {
                if(user) {
                    //TODO - maybe I should go ahead and forward user to login form?
                    return next('The email address you chose is already registered. If it is yours, please try signing in, or register with a different email address.');
                } else {
                    registerUser(req.body, function(user) {
                        common.createClaim(user, function(err, claim) {
                            if(err) return next(err);
                            var jwt = common.signJwt(claim);
                            if(config.email_confirmation) {
                                common.send_email_confirmation(req.headers.referer, user, function(err) {
                                    if(err) return next(err);
                                    res.json({code:'confirm_email', jwt: jwt, sub: user.id});
                                });
                            } else {
                                res.json({jwt: jwt, sub: user.id});
                            }
                        });
                    });        
                }
            });
        }
    });
})

module.exports = router;

