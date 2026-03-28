import type { AuthRepository } from "../domain/auth.repository";
import type { RegisterInput } from "../domain/auth.types";

export function createRegisterUseCase(repository: AuthRepository) {
  return async (input: RegisterInput) => {
    return repository.register(input);
  };
}