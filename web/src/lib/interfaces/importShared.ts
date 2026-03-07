import type {Id} from '$convex/_generated/dataModel';

export type ImportJobStatus = 'running' | 'success' | 'error' | 'cancelled';

export type ImportFeedbackSeverity = 'warning' | 'error';

export interface ImportLineFeedback {
    line: number;
    text: string;
    severity: ImportFeedbackSeverity;
}

export interface ImportMappings {
    coordinates: number | null;
    name: number | null;
    isPublic: number | null;
    category: number | null;
    image: number | null;
    tags: number | null;
    privateTags: number | null;
    description: number | null;
    address: number | null;
    city: number | null;
    country: number | null;
    installedPeriod: number | null;
    isRemoved: number | null;
    removalPeriod: number | null;
    source: number | null;
    isVisited: number | null;
}

export interface ImportMappingsForJob
    extends Omit<ImportMappings, 'coordinates' | 'name' | 'category'> {
    coordinates: number;
    name: number;
    category: number;
}

export interface NormalizedImportRow {
    line: number;
    coordinates: string;
    name: string;
    category: string;
    isVisited: boolean;
    isPublic: boolean;
    isRemoved: boolean;
    tags: string[];
    privateTags: string[];
    address?: string;
    city?: string;
    country?: string;
    installedPeriod?: string;
    removalPeriod?: string;
    description?: string;
    source?: string;
    imageSource?: string;
    imageId?: Id<'images'>;
}
