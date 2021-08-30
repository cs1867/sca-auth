const request = require("supertest");
const assert = require("assert");
const fs = require("fs");

//mine
var config = require("../api/config");

config.local = {}; //force local to be avaialble... (TODO should I use a dedicated test config?)
config.test = {
    jwt: fs.readFileSync("./api/config/test.jwt", "ascii").trim(),
};

//use temporary db for test..
config.db.storage = "/tmp/test.sqlite";

var db = require("../api/models");
var app = require("../api/server").app;

before(function (done) {
    console.log("synching sequelize");
    this.timeout(10000);
    db.sequelize.sync({ force: true }).then(function () {
        console.log("synchronized");
        done();
    });
});

describe("GET /health", function () {
    it("return 200", function (done) {
        request(app)
            .get("/health")
            .set("Accept", "application/json")
            .expect("Content-Type", /json/)
            .expect(200, done);
    });
});

/*
describe('GET /config', function() {
    it('return 200', function(done) {
        request(app)
        .get('/config')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/) 
        .end(done)
    });
});
*/
describe("/local", function () {
    describe("create user", function () {
        it("should create user 1", function (done) {
            var user = db.User.build({
                username: "test",
                fullname: "test user",
                email: "test@example.com",
                scopes: config.auth.default_scopes,
            });
            user.email_confirmation_token = "abc123";
            //console.dir(user);
            user.setPassword("testpass", function (err) {
                //console.log("set password");
                if (err) throw err;
                user.save().then(function (_user) {
                    done();
                });
            });
        });
        it("should create user 2", function (done) {
            var user = db.User.build({
                username: "test2",
                fullname: "test user2",
                email: "test2@example.com",
                scopes: config.auth.default_scopes,
            });
            user.email_confirmation_token = "abc123";
            user.setPassword("testpass", function (err) {
                if (err) throw err;
                user.save().then(function (_user) {
                    done();
                });
            });
        });
    });

    describe("/confirming_email", function () {
        it("should confirm", function (done) {
            request(app)
                .post("/confirm_email")
                .send({ token: "abc123" })
                .expect(200, done);
        });
    });

    describe("/local/auth", function () {
        it("returns valid token", function (done) {
            request(app)
                .post("/local/auth")
                .send({ username: "test", password: "testpass" })
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    console.dir(res.body);
                    done();
                });
        });
    });
});

describe("/root", function () {
    describe("get/profile", function () {
        it("get all", function (done) {
            request(app)
                .get("/profile")
                .set("Accept", "application/json")
                .set("Authorization", "Bearer " + config.test.jwt)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    assert(res.body.profiles.length == 2);
                    assert(res.body.count == 2);
                    console.dir(res.body);
                    done();
                });
        });
        it("get 1", function (done) {
            request(app)
                .get("/profile?limit=1&offset=1")
                .set("Accept", "application/json")
                .set("Authorization", "Bearer " + config.test.jwt)
                .expect("Content-Type", /json/)
                .expect(200)
                .end(function (err, res) {
                    if (err) return done(err);
                    assert(res.body.profiles.length == 1);
                    assert(res.body.count == 2);
                    console.dir(res.body);
                    done();
                });
        });
    });
});

/*
process.env.DEBUG="*";

before(function(done) {
    done();
});
*/

/*
describe('/query', function() {
    describe('/', function() {
        it('make sure /(index) redirect', function(done) {
            request(app).get('/')
            .expect(302)
            .end(function(err, res)  {
                if(err) throw err;
                done();
            });
        });
    });

    describe('/api/query', function() {
        it('try finding known record', function(done) {
            request(app).get('/api/query/find')
            .query({
                select: '', 
                //where: {'headers.BodyPartExamined': 'BRAIN' }
                where: {'SOPInstanceUID': '1.3.12.2.1107.5.2.19.45294.2014031112031074889450815' }
            })
            .expect(200)
            .end(function(err, res)  {
                if(err) { 
                    console.dir(res);
                    throw err;
                }
                //TODO - should validate the returned content?
                done();
            });
        });
        it('searching by bodypart', function(done) {
            request(app).get('/api/query/find')
            .query({
                select: 'id headers.BodyPartExamined', 
                where: {'headers.BodyPartExamined': 'BRAIN' }
            })
            .expect(200)
            .end(function(err, res)  {
                if(err) { 
                    console.dir(res);
                    throw err;
                }
            
                console.log("returned recs:"+res.body.length);
                //TODO - should validate the returned content?
                done();
            });
        });

    });
});

describe('model', function() {
    before(function(done) {
        //console.log("removing testuser");
        db.User.remove({"local.username": 'testuser'}, done);

    });

    describe('user', function() {
        it('create user', function(done) {
            var user = new User({
                local: {username: "testuser"},
                profile: {email: "testuser@email.com"},
            });
            user.save(function(err, rec) {
                if(err) return done(err);
                //console.log("done saving");
                //console.dir(rec);
                User.findOne({"profile.email": 'testuser@email.com'}, function(err, users) {
                    if(!users) {
                        return done(new Error("can't find the user created "));
                    }
                    if(users.local.username != "testuser") {
                        return done(new Error("user ID doesn't match"));
                    }
                    done();//all good
                });
            });
        });
    });
});
*/
/*
describe('etl', function(){
    var etl = require('../etl');
    describe('load', function(){
        it('try loading', function(done){
            etl.upsert('/var/data/phantom-data/MRI_Skyra/CQIE_PHANTOM_TEST_ACR_20140325_075633742/MR.1.3.12.2.1107.5.2.19.45294.2014030709502017884128865.dcm.headers.json', done);
        })
    })
});
*/

/*
after(function(done) {
    mongoose.disconnect(done);
});

*/
