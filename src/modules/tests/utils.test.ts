import * as chai from 'chai';

import {Utils} from '../utils';

const should = chai.should();

describe('Utils', () => {
    it('should generate a password', () => {
        let generatedPassword = Utils.generatePassword();
        generatedPassword.should.be.a('string');
        generatedPassword.length.should.equal(24)
    });
    it('should replace all instances in string', () => {
        let originalString = `{{replaceme}}, but don't replace me. Also, make sure to {{replaceme}}`;
        let replacedString = Utils.replaceAll(originalString, '{{replaceme}}', 'replace me');
        replacedString.should.be.a('string');
        replacedString.should.equal(`replace me, but don't replace me. Also, make sure to replace me`);
    })
});
