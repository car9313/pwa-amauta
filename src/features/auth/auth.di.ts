import { createLoginUseCase } from "./application/login.use-case";
import { createLogoutUseCase } from "./application/logout.use-case";
import { createRegisterUseCase } from "./application/register.use-case";
import { mockAuthRepository } from "./infrastructure/mock-auth.repository";

export const loginUseCase = createLoginUseCase(mockAuthRepository);
export const registerUseCase = createRegisterUseCase(mockAuthRepository);
export const logoutUseCase = createLogoutUseCase(mockAuthRepository);