import {z} from 'zod';

export const schema = z
    .object({
        currentPassword: z.string().min(1, 'Пожалуйста, введите текущий пароль'),
        password: z.string().min(1, 'Пожалуйста, введите пароль'),
        passwordConfirm: z.string().min(1, 'Пожалуйста, повторите пароль'),
        signOutOtherSessions: z.boolean().default(false),
    })
    .superRefine((data, ctx) => {
        if (data.password !== data.passwordConfirm) {
            ctx.addIssue({
                code: 'custom',
                message: 'Пароли не совпадают',
                path: ['passwordConfirm'],
            });
        }
    });
