export const authKeys = {
  all: ["auth"] as const,
  login: () => [...authKeys.all, "login"] as const,
  register: () => [...authKeys.all, "register"] as const,

  parentDashboard: (parentId: string, tenantId: string | null) =>
    [...authKeys.all, "parent", parentId, tenantId] as const,

  studentProgress: (studentId: string, tenantId: string | null) =>
    [...authKeys.all, "progress", studentId, tenantId] as const,
};

export const exerciseKeys = {
  all: ["exercises"] as const,
  next: (studentId: string, tenantId: string | null) =>
    [...exerciseKeys.all, "next", studentId, tenantId] as const,
};

export const studentKeys = {
  all: ["student"] as const,
  dashboard: (studentId: string) => [...studentKeys.all, "dashboard", studentId] as const,
};

export const progressKeys = {
  all: ["progress"] as const,
  student: (studentId: string) => [...progressKeys.all, "student", studentId] as const,
};
