import type {ParamMatcher} from '@sveltejs/kit';

const ULID_REGEX = /^[0-9A-HJKMNP-TV-Z]{26}$/i;

export const match: ParamMatcher = param => {
    return ULID_REGEX.test(param);
};
