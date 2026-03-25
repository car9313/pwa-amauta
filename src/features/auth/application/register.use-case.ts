import type { RegisterData } from "../domain/auth.types";
import AuthApiRepository from './../infrastructure/auth-api.repository';

export default function RegisterUseCase() {
return {
 execute(data: RegisterData){
    return AuthApiRepository().register(data);
  }
}
 }