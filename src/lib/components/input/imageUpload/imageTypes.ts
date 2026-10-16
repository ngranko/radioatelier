import {MAX_OBJECT_IMAGES} from '$lib/utils/fieldLimits';
import {toast} from 'svelte-sonner';

export const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export const IMAGE_INPUT_ACCEPT = [...SUPPORTED_IMAGE_TYPES].join(',');

export function selectUploadable(files: File[], room: number) {
    const supported = files.filter(file => SUPPORTED_IMAGE_TYPES.has(file.type));
    if (supported.length < files.length) {
        toast.warning('Неподдерживаемый тип файла');
    }

    const fitting = supported.slice(0, room);
    if (fitting.length < supported.length) {
        toast.warning(`У точки может быть не больше ${MAX_OBJECT_IMAGES} фото`);
    }

    return fitting;
}
