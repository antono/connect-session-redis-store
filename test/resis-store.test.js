
/**
 * Module dependencies.
 */

var connect = require('connect'),
    assert = require('assert'),
    helpers = require('./helpers'),
    redisClient = require('../support/redis-node-client/lib/redis-client').createClient(),
    RedisStore = require('../lib/connect-session-redis-store');
 
// Session

var Session = connect.session.Session;

module.exports = {
    'test RedisStore': function(){
        var n = 0, sid;
        var server = helpers.run(
            connect.cookieDecoder(),
            connect.session({ store: new RedisStore({ client: redisClient }) }),

            function(req, res, next) {
                assert.ok(req.sessionStore, 'Test req.sessionStore');
                assert.ok(req.sessionID, 'Test req.sessionID');
                switch (n++) {
                    case 0:
                        assert.eql(['lastAccess'], Object.keys(req.session), 'Test RedisStore session initialization');
                        break;
                    case 1:
                        req.sessionStore.destroy(req.sessionID, function(err){
                            assert.ok(!err, 'Test RedisStore#destroy() when present');
                        });
                        break;
                    case 2:
                        req.sessionStore.destroy(req, function(err, destroyed){
                            assert.ok(!err);
                            assert.ok(!destroyed, 'Test RedisStore#destroy()');
                        });
                        break;
                    case 3:
                        req.sessionStore.get(req.sessionID, function(err, sess){
                            assert.ok(sess, 'Test RedisStore#get() when present');
                            req.session.destroy(function(err){
                                assert.ok(!err);
                                req.sessionStore.get(req.sessionID, function(err, sess){
                                    assert.ok(!sess, 'Test MemoryStore#get() when not present');
                                });
                            });
                        });
                        break;
                }
                next();
            }
        );

        server.pending = 5;
        server.request('GET', '/').end();
        server.request('GET', '/', { 'Cookie': 'connect.sid=123123' }).end();

        var req = server.request('GET', '/', { 'User-Agent': 'foo' });
        req.addListener('response', function(res){
            var setCookie = res.headers['set-cookie'][0];
            sid = setCookie.match(/connect\.sid=([^;]+)/)[1];
            assert.ok(setCookie.indexOf('connect.sid=') === 0, 'Test MemoryStore Set-Cookie connect.sid');
            assert.ok(setCookie.indexOf('httpOnly') !== -1, 'Test MemoryStore Set-Cookie httpOnly');
            assert.ok(setCookie.indexOf('expires=') !== -1, 'Test MemoryStore Set-Cookie expires');
            server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid, 'User-Agent': 'foo' }).end();
            server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid, 'User-Agent': 'bar' }).end();
            server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid, 'User-Agent': 'foo' }).end();
            server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid, 'User-Agent': 'foo' }).end();
            server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid, 'User-Agent': 'foo' }).end();
            server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid, 'User-Agent': 'foo' }).end();
            server.request('GET', '/', { 'Cookie': 'connect.sid=' + sid, 'User-Agent': 'foo' }).end();
        });
        req.end();
    }
};
