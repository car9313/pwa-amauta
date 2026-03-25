import { mockAuthRepository } from "../infrastructure/mock-auth.repository";
import { createLoginUseCase } from "./login.use-case";
import { createLogoutUseCase } from "./logout.use-case";
import { createRegisterUseCase } from "./register.use-case";

export const loginUseCase = createLoginUseCase(mockAuthRepository);
export const registerUseCase = createRegisterUseCase(mockAuthRepository);
export const logoutUseCase = createLogoutUseCase(mockAuthRepository);