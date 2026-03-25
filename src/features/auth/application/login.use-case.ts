import type { AuthCredentials } from "../domain/auth.types";
import AuthApiRepository from './../infrastructure/auth-api.repository';

export default function LoginUseCase() {
return {
 execute(credentials: AuthCredentials){
    return AuthApiRepository().login(credentials);
  }
}
 }