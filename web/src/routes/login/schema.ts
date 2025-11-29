import {z} from 'zod';

export const loginSchema = z.object({
    email: z.email('Это непохоже на email'),
    password: z.string().min(1, 'Пожалуйста, введите пароль'),
});
