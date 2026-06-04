import type {Id} from '../_generated/dataModel';
import type {NotionPageFields} from '../notion/types';

export type NotionPageSnapshot = {
    pageId: string;
    fields: NotionPageFields;
};

export type EligibleOwnerPage = {
    page: Array<{_id: Id<'users'>}>;
    isDone: boolean;
    continueCursor: string;
};

export type Discrepancy =
    | {
          kind: 'ambiguous_match';
          objectId: Id<'objects'>;
          name: string;
          pageIds: string[];
      }
    | {
          kind: 'unmatched_app_object';
          objectId: Id<'objects'>;
          name: string;
          syncNotionPageId: string | null;
      }
    | {
          kind: 'missing_notion_page';
          objectId: Id<'objects'>;
          name: string;
          notionPageId: string;
      }
    | {
          kind: 'link_mismatch';
          objectId: Id<'objects'>;
          name: string;
          syncNotionPageId: string;
          matchedPageId: string;
          matchKind: string;
      }
    | {
          kind: 'field_mismatch';
          objectId: Id<'objects'>;
          notionPageId: string;
          name: string;
          differingFields: string[];
      }
    | {
          kind: 'missing_sync_record';
          objectId: Id<'objects'>;
          notionPageId: string;
          name: string;
          matchKind: string;
      }
    | {
          kind: 'stale_outbound_hash';
          objectId: Id<'objects'>;
          notionPageId: string;
          name: string;
          storedHash: string | null;
          expectedHash: string;
      }
    | {
          kind: 'unmatched_notion_page';
          notionPageId: string;
          name: string;
      };
