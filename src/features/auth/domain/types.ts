import { z } from "zod";

export const roleEnum = z.enum(["student", "parent", "teacher"]);
export type UserRole = z.infer<typeof roleEnum>;


export const loginResponseSchema = z.object({
  token: z.string(),
  role: roleEnum,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

const baseUserFields = z.object({
  name: z.string(),
  email: z.string().email(),
  tenantId: z.string(),
});

export const studentUserSchema = baseUserFields.extend({
  role: z.literal("student"),
  studentId: z.string(),
});
export type StudentUser = z.infer<typeof studentUserSchema>;

const childFields = z.object({
  studentId: z.string(),
  name: z.string(),
  avatar: z.string().optional(),
  level: z.number().int().positive(),
  points: z.number().int().nonnegative(),
  precision: z.number().min(0).max(100),
  streakDays: z.number().int().nonnegative(),
});

export const parentUserSchema = baseUserFields.extend({
  role: z.literal("parent"),
  parentId: z.string(),
  children: z.array(childFields),
});
export type ParentUser = z.infer<typeof parentUserSchema>;

export const teacherUserSchema = baseUserFields.extend({
  role: z.literal("teacher"),
  teacherId: z.string(),
  classIds: z.array(z.string()),
});
export type TeacherUser = z.infer<typeof teacherUserSchema>;

export const authUserSchema = z.discriminatedUnion("role", [
  studentUserSchema,
  parentUserSchema,
  teacherUserSchema,
]);
export type AuthUser = z.infer<typeof authUserSchema>;

export const authResponseSchema = z.object({
  user: authUserSchema,
  token: z.string(),
  refresh: z.string().optional(),
  expiresIn: z.number().optional(),
  tenantId: z.string().optional(),
});
export type AuthResponse = z.infer<typeof authResponseSchema>;

export const addChildRequestSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Ingresa un correo válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
export type AddChildRequest = z.infer<typeof addChildRequestSchema>;

export const childResponseSchema = childFields;
export type ChildResponse = z.infer<typeof childResponseSchema>;
