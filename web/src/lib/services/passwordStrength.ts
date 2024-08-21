import type {Score} from '@zxcvbn-ts/core';
import {zxcvbn, zxcvbnOptions} from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';
import * as zxcvbnEnPackage from '@zxcvbn-ts/language-en';

const options = {
    translations: zxcvbnEnPackage.translations,
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
    dictionary: {
        ...zxcvbnCommonPackage.dictionary,
        ...zxcvbnEnPackage.dictionary,
    },
};

export function getPasswordScore(password: string): Score {
    zxcvbnOptions.setOptions(options);
    const result = zxcvbn(password);
    return result.score;
}

export function isPasswordAcceptable(password: string): boolean {
    return getPasswordScore(password) > 1;
}
