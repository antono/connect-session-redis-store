/*!
 * Connect Session Redis Store
 * Copyright (c) 2010 Antono Vasiljev
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var sys = require('sys'),
    utils = require('connect/utils'),
    Session = require('connect/middleware/session/session'),
    Store = require('connect/middleware/session/store');

/**
 * Export the `setup()` function.
 */

exports = module.exports = RedisStore;

/**
 * Initialize RedisStore with the given options.
 *
 * @param {Object} options
 * @api public
 */

var RedisStore = module.exports = function RedisStore(options) {
    options = options || {};

    Store.call(this, options);

    if (!options.client) {
        throw new Error('Options for RedisStore must provide redis client object');
    } else {
        this.client = options.client;
    }
};

sys.inherits(RedisStore, Store);

/**
 * Attempt to fetch session by the given `sid`.
 *
 * @param {String} sid
 * @param {Function} fn
 * @api public
 */

RedisStore.prototype.get = function(sid, fn) {
    this.client.get(sid, function(err, value) {
        fn(err, JSON.parse(value));
    });
};

/**
 * Attempt to set session by the given `sid`.
 *
 * @param {String} sid
 * @param {String} session data
 * @param {Function} fn
 * @api public
 */

RedisStore.prototype.set = function(sid, sess, fn) {
    this.client.set(sid, JSON.stringify(sess), function() { 
        fn && fn();
    });
};


/**
 * Destroy the session associated with the given `sid`.
 *
 * @param {String} sid
 * @api public
 */

RedisStore.prototype.destroy = function(sid, fn) {
    this.client.del(sid, function(err, count) {
        fn && fn()
    });
};
