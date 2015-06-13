var chai = require('chai');
var Bot = require('../index.js');
var utils = require('../libs/utils.js');
var bot = new Bot({token: 'token'});
var sinon = require('sinon');
var vow = require('vow');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var expect = require('chai').expect;
var request = require('request');

describe('slack-bot-api', function() {

    describe('#find', function() {

        it('1', function() {
            var data = [{a: 1, b: 2}, {b: 3, c: 4}];
            expect(utils.find(data, {a: 1})).to.equal(data[0]);
        });
        it('2', function() {
            var data = [{a: 1, b: 2, c: 4}, {b: 3, c: 4}];
            expect(utils.find(data, {a: 1, c: 4})).to.equal(data[0]);
        });
        it('3', function() {
            var data = [{a: 1, b: 2}, {b: 3, c: 4}];
            expect(utils.find(data, {b: 3})).to.equal(data[1]);
        });
        it('4', function() {
            var data = [{a: 1, b: 2}, {b: 3, c: 4}];
            expect(utils.find(data, {a: 1, b: 2, c: 3})).to.not.equal(data[0]);
        });
    });

    describe('#_api', function() {
        afterEach(function() {
            request.get.restore();
        });

        it('check url', function(done) {
            var r1;

            sinon.stub(request, 'get', function(data, cb) {
                r1 = data;
                cb(null, null, '{}');
            });

            bot._api('method', {foo: 1, bar: 2, baz: 3}).always(function() {
                expect(r1.url).to.equal('https://slack.com/api/method?foo=1&bar=2&baz=3&token=token');
                done();
            })
        });

        it('response without error', function(done) {
            sinon.stub(request, 'get', function(data, cb) {
                cb(null, null, "{\"ok\": true}");
            });

            bot._api('method',  {foo: 1, bar: 2, baz: 3}).then(function(data) {
                expect(data.ok).to.equal(true);
                done();
            })
        });

        it('response with error', function(done) {
            sinon.stub(request, 'get', function(data, cb) {
                cb(null, null, "{\"ok\": false}");
            });

            bot._api('method').fail(function(data) {
                expect(data.ok).to.equal(false);
                done();
            })
        });
    });

    describe('#postTo', function() {
        beforeEach(function() {
            sinon.stub(bot, 'getChannels');
            sinon.stub(bot, 'getUsers');
            sinon.stub(bot, 'getGroups');

        });

        afterEach(function() {
            bot.getChannels.restore();
            bot.getUsers.restore();
            bot.getGroups.restore();
        });

        it('1', function(cb) {
            bot.getChannels.returns(vow.fulfill({channels: [{name: 'name1', is_channel: true}]}));
            bot.getUsers.returns(vow.fulfill({members: []}));
            bot.getGroups.returns(vow.fulfill({groups: []}));
            sinon.stub(bot, 'postMessageToChannel').returns(vow.fulfill());

            bot.postTo('name1', 'text').then(function() {
                expect(bot.postMessageToChannel).to.have.callCount(1);
                expect(bot.postMessageToChannel).to.have.been.calledWith('name1', 'text');
                cb();
            });

        });

        it('2', function(cb) {
            bot.getChannels.returns(vow.fulfill({channels: []}));
            bot.getUsers.returns(vow.fulfill({members: [{name: 'name1'}]}));
            bot.getGroups.returns(vow.fulfill({groups: []}));
            sinon.stub(bot, 'postMessageToUser').returns(vow.fulfill());

            bot.postTo('name1', 'text').then(function() {
                expect(bot.postMessageToUser).to.have.callCount(1);
                expect(bot.postMessageToUser).to.have.been.calledWith('name1', 'text');
                cb();
            });

        });

        it('3', function(cb) {
            bot.getChannels.returns(vow.fulfill({channels: []}));
            bot.getUsers.returns(vow.fulfill({members: []}));
            bot.getGroups.returns(vow.fulfill({groups: [{name: 'name1', is_group: true}]}));
            sinon.stub(bot, 'postMessageToGroup').returns(vow.fulfill());

            bot.postTo('name1', 'text').then(function() {
                expect(bot.postMessageToGroup).to.have.callCount(1);
                expect(bot.postMessageToGroup).to.have.been.calledWith('name1', 'text');
                cb();
            });

        });
    });

});
