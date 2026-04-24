export const authKeys = {
  all: ["auth"] as const,
  login: () => [...authKeys.all, "login"] as const,
  register: () => [...authKeys.all, "register"] as const,
  session: () => [...authKeys.all, "session"] as const,
  refresh: () => [...authKeys.all, "refresh"] as const,

  parentDashboard: (parentId: string, tenantId: string | null) =>
    [...authKeys.all, "parent", parentId, tenantId] as const,

  studentProgress: (studentId: string, tenantId: string | null) =>
    [...authKeys.all, "progress", studentId, tenantId] as const,
};

export const exerciseKeys = {
  all: ["exercises"] as const,
  detail: (id: string) => [...exerciseKeys.all, "detail", id] as const,
  byType: (type: string) => [...exerciseKeys.all, "byType", type] as const,
  byDifficulty: (difficulty: number) => [...exerciseKeys.all, "byDifficulty", difficulty] as const,
  count: () => [...exerciseKeys.all, "count"] as const,
  next: (studentId: string, tenantId: string | null) =>
    [...exerciseKeys.all, "next", studentId, tenantId] as const,
};

export const studentKeys = {
  all: ["student"] as const,
  dashboard: (studentId: string) => [...studentKeys.all, "dashboard", studentId] as const,
  allData: () => [...studentKeys.all, "all"] as const,
};

export const lessonKeys = {
  all: ["lessons"] as const,
  detail: (id: string) => [...lessonKeys.all, "detail", id] as const,
  bySubject: (subject: string) => [...lessonKeys.all, "bySubject", subject] as const,
  allData: () => [...lessonKeys.all] as const,
};

export const progressKeys = {
  all: ["progress"] as const,
  student: (studentId: string) => [...progressKeys.all, "student", studentId] as const,
  byLesson: (studentId: string, lessonId: string) =>
    [...progressKeys.all, "byLesson", studentId, lessonId] as const,
  count: () => [...progressKeys.all, "count"] as const,
};
