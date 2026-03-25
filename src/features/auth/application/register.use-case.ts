import type { AuthRepository } from "../domain/auth.repository";
import type { RegisterInput } from "../domain/auth.types";

/* export default function RegisterUseCase() {
return {
 execute(data: RegisterData){
    return AuthApiRepository().register(data);
  }
}
 } */
// src/features/auth/application/register.use-case.ts

export function createRegisterUseCase(repository: AuthRepository) {
  return async (input: RegisterInput) => {
    return repository.register(input);
  };
}