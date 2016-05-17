/**
 * @name Question
 * @description
 *      A question to ask the user and relay back to the asking device
 */
export class Question {
    /**
     * @property {string}           inquiry
     *      Human readable question text
     */
    inquiry: string;
    /**
     * @property {string}           key
     *      Machine readable question key
     */
    key: string;
    /**
     * @property {QuestionTypes}    type
     *      Type of question that is being asked
     */
    type: QuestionTypes;
    /**
     * @property {RegExp}           pattern
     *      Optional pattern that answer must match
     */
    pattern: RegExp;
    /**
     * @property {RegExp}           options
     *      Set of options to choose from if `type` === `QuestionTypes.SPINNER`
     */
    options: Array<string>;
    /**
     * @property {string | number | Array<number>}  answer
     *      User given answer to the question
     */
    answer: string | number | Array<number>;

    constructor (inquiry: string, key: string, type: QuestionTypes, pattern?: RegExp | Array<string>, answer?: string | number | Array<number>) {
        this.inquiry = inquiry;
        this.key = key;
        this.type = type;
        if (!Array.isArray(pattern)) {
            this.pattern = pattern;
        } else {
            this.options = pattern;
        }
        this.answer = answer;
    }
}

/**
 * @name QuestionTypes
 * @description
 *      Enum of available question types
 */
export enum QuestionTypes {
    TEXT,
    NUMBER,
    SLIDER,
    BOOLEAN,
    SPINNER,
    COLOR,
    PASSWORD,
    ADDRESS,
    TEL,
    EMAIL
}
