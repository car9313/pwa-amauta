import { describe, it, expect } from "vitest";
import {
  roleEnum,
  loginResponseSchema,
  studentUserSchema,
  parentUserSchema,
  teacherUserSchema,
  authUserSchema,
  authResponseSchema,
  addChildRequestSchema,
  childResponseSchema,
} from "./types";

describe("roleEnum", () => {
  it("accepts valid roles", () => {
    expect(roleEnum.parse("student")).toBe("student");
    expect(roleEnum.parse("parent")).toBe("parent");
    expect(roleEnum.parse("teacher")).toBe("teacher");
  });

  it("rejects invalid roles", () => {
    expect(() => roleEnum.parse("admin")).toThrow();
    expect(() => roleEnum.parse("")).toThrow();
    expect(() => roleEnum.parse(123)).toThrow();
  });
});

describe("loginResponseSchema", () => {
  it("accepts valid login response", () => {
    const data = { token: "abc123", role: "student" };
    expect(loginResponseSchema.parse(data)).toEqual(data);
  });

  it("rejects missing token", () => {
    expect(() => loginResponseSchema.parse({ role: "student" })).toThrow();
  });

  it("rejects invalid role", () => {
    expect(() => loginResponseSchema.parse({ token: "abc", role: "admin" })).toThrow();
  });
});

describe("studentUserSchema", () => {
  const valid = { name: "Mario", email: "mario@test.com", tenantId: "t1", role: "student" as const, studentId: "stu_001" };

  it("accepts valid student", () => {
    expect(studentUserSchema.parse(valid)).toEqual(valid);
  });

  it("rejects missing studentId", () => {
    const { studentId: _sid, ...rest } = valid;
    expect(() => studentUserSchema.parse(rest)).toThrow();
  });

  it("rejects wrong role", () => {
    expect(() => studentUserSchema.parse({ ...valid, role: "parent" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => studentUserSchema.parse({ ...valid, email: "notanemail" })).toThrow();
  });
});

describe("parentUserSchema", () => {
  const valid = {
    name: "Ana", email: "ana@test.com", tenantId: "t1", role: "parent" as const,
    parentId: "par_001",
    children: [{ studentId: "s1", name: "Child", level: 1, points: 10, precision: 50, streakDays: 2 }],
  };

  it("accepts valid parent with children", () => {
    expect(parentUserSchema.parse(valid)).toEqual(valid);
  });

  it("accepts empty children array", () => {
    expect(parentUserSchema.parse({ ...valid, children: [] })).toBeTruthy();
  });

  it("rejects missing parentId", () => {
    const { parentId: _pid, ...rest } = valid;
    expect(() => parentUserSchema.parse(rest)).toThrow();
  });

  it("rejects child with negative points", () => {
    expect(() =>
      parentUserSchema.parse({
        ...valid,
        children: [{ studentId: "s1", name: "Child", level: 1, points: -5, precision: 50, streakDays: 2 }],
      })
    ).toThrow();
  });

  it("rejects precision over 100", () => {
    expect(() =>
      parentUserSchema.parse({
        ...valid,
        children: [{ studentId: "s1", name: "Child", level: 1, points: 10, precision: 150, streakDays: 2 }],
      })
    ).toThrow();
  });
});

describe("teacherUserSchema", () => {
  const valid = {
    name: "Carlos", email: "carlos@test.com", tenantId: "t1", role: "teacher" as const,
    teacherId: "tea_001", classIds: ["cls_001", "cls_002"],
  };

  it("accepts valid teacher", () => {
    expect(teacherUserSchema.parse(valid)).toEqual(valid);
  });

  it("accepts empty classIds", () => {
    expect(teacherUserSchema.parse({ ...valid, classIds: [] })).toBeTruthy();
  });

  it("rejects missing teacherId", () => {
    const { teacherId: _tid, ...rest } = valid;
    expect(() => teacherUserSchema.parse(rest)).toThrow();
  });
});

describe("authUserSchema (discriminated union)", () => {
  it("accepts student role", () => {
    const data = { name: "Mario", email: "m@t.com", tenantId: "t1", role: "student" as const, studentId: "s1" };
    expect(authUserSchema.parse(data).role).toBe("student");
  });

  it("accepts parent role", () => {
    const data = { name: "Ana", email: "a@t.com", tenantId: "t1", role: "parent" as const, parentId: "p1", children: [] };
    expect(authUserSchema.parse(data).role).toBe("parent");
  });

  it("accepts teacher role", () => {
    const data = { name: "Carlos", email: "c@t.com", tenantId: "t1", role: "teacher" as const, teacherId: "t1", classIds: [] };
    expect(authUserSchema.parse(data).role).toBe("teacher");
  });

  it("rejects unknown role", () => {
    expect(() => authUserSchema.parse({ name: "X", email: "x@t.com", tenantId: "t1", role: "admin" })).toThrow();
  });
});

describe("authResponseSchema", () => {
  const valid = {
    user: { name: "Mario", email: "m@t.com", tenantId: "t1", role: "student" as const, studentId: "s1" },
    token: "tok_abc",
  };

  it("accepts valid auth response", () => {
    expect(authResponseSchema.parse(valid)).toEqual(valid);
  });

  it("accepts optional fields", () => {
    const full = { ...valid, refresh: "ref_abc", expiresIn: 900, tenantId: "t1" };
    expect(authResponseSchema.parse(full)).toEqual(full);
  });

  it("rejects missing token", () => {
    const { token: _tok, ...rest } = valid;
    expect(() => authResponseSchema.parse(rest)).toThrow();
  });
});

describe("addChildRequestSchema", () => {
  const valid = { name: "Child", email: "child@test.com", password: "123456" };

  it("accepts valid request", () => {
    expect(addChildRequestSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty name", () => {
    expect(() => addChildRequestSchema.parse({ ...valid, name: "" })).toThrow("El nombre es requerido");
  });

  it("rejects invalid email", () => {
    expect(() => addChildRequestSchema.parse({ ...valid, email: "bad" })).toThrow("correo");
  });

  it("rejects short password", () => {
    expect(() => addChildRequestSchema.parse({ ...valid, password: "123" })).toThrow("Mínimo 6");
  });
});

describe("childResponseSchema", () => {
  const valid = { studentId: "s1", name: "Child", level: 2, points: 50, precision: 80, streakDays: 3 };

  it("accepts valid child response", () => {
    expect(childResponseSchema.parse(valid)).toEqual(valid);
  });

  it("accepts optional avatar", () => {
    expect(childResponseSchema.parse({ ...valid, avatar: "https://img.com/a.png" }).avatar).toBe("https://img.com/a.png");
  });

  it("rejects invalid precision", () => {
    expect(() => childResponseSchema.parse({ ...valid, precision: 101 })).toThrow();
  });
});
