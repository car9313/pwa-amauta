import type { AuthRepository } from "../domain/auth.repository";
import type { AuthCredentials } from "../domain/auth.types";

/* export default function LoginUseCase() {
return {
 execute(credentials: AuthCredentials){
    return AuthApiRepository().login(credentials);
  }
}
 } */

 export function createLoginUseCase(repository: AuthRepository) {
  return async (input: AuthCredentials) => {
    return repository.login(input);
  };
}