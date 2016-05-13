import * as chai from 'chai';
import * as fs from 'fs';

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
    });

    describe('backupFile', () => {
        it('should create duplicate file, "filename.back"', (done) => {
            let filePath: string = './this-file-exsits';
            let fileContent: string = 'Some file contents';
            fs.writeFile(filePath, fileContent, () => {
                Utils.backupFile(filePath);

                Promise.all([
                    new Promise((resolve, reject) => {
                        fs.readFile(`${filePath}.back`, (err, data) => {
                            should.not.exist(err);
                            data.toString().should.equal(fileContent);
                            fs.unlink(`${filePath}.back`);
                            resolve();
                        });
                    }),
                    new Promise((resolve, reject) => {
                        fs.readFile(filePath, (err, data) => {
                            should.not.exist(err);
                            data.toString().should.equal(fileContent);
                            fs.unlink(filePath);
                            resolve();
                        });
                    })
                ]).then(() => {
                    done();
                });
            });
        })
        it('should gracefully fail to backup file that doesn\' exist', () => {
            Utils.backupFile('/this/file/doesnt/exist')
        })
    });
});
