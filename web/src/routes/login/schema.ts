import {z} from 'zod';

export const loginSchema = z.object({
    email: z.email('Это непохоже на email'),
    password: z.string().min(1, 'Пожалуйста, введите пароль'),
});

export const secondFactorSchema = z.object({
    verificationCode: z.string().min(1, 'Введите код подтверждения'),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;
export type SecondFactorFormInputs = z.infer<typeof secondFactorSchema>;
