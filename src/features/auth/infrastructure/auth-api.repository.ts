import type {
  AuthCredentials,
  AuthSession,
  AuthUser,
  RegisterData,
} from "../domain/auth.types";

async function login(credentials: AuthCredentials){
 await new Promise((resolve) => setTimeout(resolve, 700));
 const user:AuthUser={
  id: "1",
        name: "Mario",
        email: credentials.email,
        role: null,
 }
 
 return {
  token: "mock-token",
      user,
 };
}
async function register(data: RegisterData): Promise<AuthSession> {
    await new Promise((resolve) => setTimeout(resolve, 700));
  const user:AuthUser={
     id: "2",
        name: data.name,
        email: data.email,
        role: null,
      
  }
    return {
      token: "mock-token",
      user
    };
  }

export default function AuthApiRepository (){
return {
    login(credentials: AuthCredentials){
     return login(credentials)   
    },
   register(data: RegisterData){
    return register(data)
   }
} 
}
