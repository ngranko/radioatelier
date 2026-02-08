import {z} from 'zod';

export const loginSchema = z.object({
    email: z.email('Это непохоже на email'),
    password: z.string().min(1, 'Пожалуйста, введите пароль'),
});

export const secondFactorSchema = z.object({
    verificationCode: z.string().min(1, 'Введите код подтверждения'),
});

export const resetPasswordRequestSchema = z.object({
    email: z.email('Это непохоже на email'),
});

export const resetPasswordConfirmSchema = z
    .object({
        verificationCode: z.string().min(1, 'Введите код подтверждения'),
        password: z.string().min(1, 'Введите новый пароль'),
        confirmPassword: z.string().min(1, 'Подтвердите новый пароль'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

export type LoginFormInputs = z.infer<typeof loginSchema>;
export type SecondFactorFormInputs = z.infer<typeof secondFactorSchema>;
export type ResetPasswordRequestInputs = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordConfirmInputs = z.infer<typeof resetPasswordConfirmSchema>;
