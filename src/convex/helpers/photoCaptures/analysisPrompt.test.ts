import {describe, expect, it} from 'vitest';
import type {Id} from '../../_generated/dataModel';
import {type AnalysisContext, InvalidAnalysisError, resolveAnalysis} from './analysisPrompt';

const context: AnalysisContext = {
    categories: [{id: 'category-1' as Id<'categories'>, name: 'Вывеска'}],
    tags: [
        {id: 'tag-1' as Id<'tags'>, name: 'неон'},
        {id: 'tag-2' as Id<'tags'>, name: 'шрифт'},
    ],
    exampleTitles: [],
    address: null,
};

describe('resolveAnalysis', () => {
    it('maps the chosen names back to archive ids and drops invented tags', () => {
        const analysis = resolveAnalysis(
            {title: ' ГАСТРОНОМ ', category: 'Вывеска', tags: ['неон', 'выдумка']},
            context,
        );

        expect(analysis).toEqual({name: 'ГАСТРОНОМ', categoryId: 'category-1', tagIds: ['tag-1']});
    });

    it('rejects a category the archive does not have', () => {
        const raw = {title: 'Мозаика', category: 'Мозаика', tags: []};

        expect(() => resolveAnalysis(raw, context)).toThrow(InvalidAnalysisError);
    });
});
