import {isPasswordAcceptable} from '$lib/services/passwordStrength.ts';
import {z} from 'zod';

export const schema = z
    .object({
        password: z.string().min(1, 'Пожалуйста, введите пароль'),
        passwordConfirm: z.string().min(1, 'Пожалуйста, повторите пароль'),
    })
    .superRefine((data, ctx) => {
        if (data.password !== data.passwordConfirm) {
            ctx.addIssue({
                code: 'custom',
                message: 'Пароли не совпадают',
                path: ['passwordConfirm'],
            });
        }
        if (!isPasswordAcceptable(data.password)) {
            ctx.addIssue({
                code: 'custom',
                message: 'Слишком слабый пароль',
                path: ['password'],
            });
        }
    });
