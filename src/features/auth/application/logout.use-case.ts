import type { AuthRepository } from "../domain/auth.repository";

export function createLogoutUseCase(repository: AuthRepository) {
  return async () => {
    try {
      // futuro: llamada a API
      await repository.logout?.();
    } catch {
      // ignoramos errores en logout (buena práctica UX)
    }
  };
}