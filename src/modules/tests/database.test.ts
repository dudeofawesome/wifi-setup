import * as chai from 'chai';
import * as fs from 'fs';

const database = require('../database')('io.orleans.wifi-setup.test');

const should = chai.should();

describe('Database', () => {
    it('should init', (done) => {
        database.init().then(() => {
            done()
            it('should start', (done) => {
                database.init().start(() => {
                    done()
                    it('should store and retrieve wifi credentials', (done) => {
                        let testSSID = 'testSSID';
                        let testPassword = 'testPassword';
                        database.setWifiCreds(testSSID, testPassword).then(() => {
                            database.getWifiCreds().then((creds) => {
                                creds.SSID.should.equal(testSSID);
                                creds.password.should.equal(testPassword);
                                done();
                                it('should stop', (done) => {
                                    database.stop().then(() => done());
                                });
                            });
                        })
                    });
                });
            });
        });
    });
});
