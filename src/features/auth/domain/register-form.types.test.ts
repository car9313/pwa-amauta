import { describe, it, expect } from "vitest";
import { registerFormSchema } from "./register-form.types";

describe("registerFormSchema", () => {
  const valid = {
    name: "Ana María",
    email: "ana@example.com",
    password: "123456",
    confirmPassword: "123456",
    role: "parent" as const,
  };

  it("accepts valid registration data", () => {
    expect(registerFormSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty name", () => {
    expect(() => registerFormSchema.parse({ ...valid, name: "" })).toThrow("El nombre es requerido");
  });

  it("rejects invalid email", () => {
    expect(() => registerFormSchema.parse({ ...valid, email: "notanemail" })).toThrow("correo");
  });

  it("rejects short password", () => {
    expect(() => registerFormSchema.parse({ ...valid, password: "12345" })).toThrow("Mínimo 6");
  });

  it("rejects short confirmPassword", () => {
    expect(() => registerFormSchema.parse({ ...valid, confirmPassword: "12345" })).toThrow("Confirma tu contraseña");
  });

  it("rejects password mismatch via refine", () => {
    expect(() =>
      registerFormSchema.parse({ ...valid, confirmPassword: "different" })
    ).toThrow("Las contraseñas no coinciden");
  });

  it("rejects non-parent role", () => {
    expect(() => registerFormSchema.parse({ ...valid, role: "student" })).toThrow();
  });

  it("rejects missing confirmPassword", () => {
    const { confirmPassword: _confirm, ...rest } = valid;
    expect(() => registerFormSchema.parse(rest)).toThrow();
  });

  it("rejects empty object", () => {
    expect(() => registerFormSchema.parse({})).toThrow();
  });
});
