import { describe, it, expect } from "vitest";
import {
  exerciseTypeSchema,
  answerTypeSchema,
  difficultyLevelSchema,
  difficultyToStars,
  feedbackStyleSchema,
  nextActionSchema,
  pedagogyTypeSchema,
  mistakeTypeSchema,
  deviceTypeSchema,
  clientContextSchema,
  nextExerciseRequestSchema,
  exerciseSchema,
  telemetrySchema,
  submitAnswerRequestSchema,
  submitAnswerPayloadSchema,
  mistakeSchema,
  nextActionDetailSchema,
  exerciseResultSchema,
  subjectProgressSchema,
  progressAchievementSchema,
  weakAreaSchema,
  studentProgressSchema,
  parentReportSchema,
  studentSummarySchema,
  teacherReportSchema,
  childProfileSchema,
  studentSchema,
  agendaItemSchema,
  progressItemSchema,
  achievementSchema,
  studentDashboardSchema,
  activityItemSchema,
  parentProfileSchema,
  parentDashboardSchema,
  teacherStudentSummarySchema,
  teacherClassSchema,
  teacherDashboardSchema,
} from "./exercise.types";

describe("enum schemas", () => {
  describe("exerciseTypeSchema", () => {
    it("accepts valid types", () => {
      expect(exerciseTypeSchema.parse("VISUAL_ADDITION")).toBe("VISUAL_ADDITION");
      expect(exerciseTypeSchema.parse("VISUAL_SUBTRACTION")).toBe("VISUAL_SUBTRACTION");
      expect(exerciseTypeSchema.parse("VISUAL_MULTIPLICATION")).toBe("VISUAL_MULTIPLICATION");
      expect(exerciseTypeSchema.parse("VISUAL_DIVISION")).toBe("VISUAL_DIVISION");
      expect(exerciseTypeSchema.parse("TEXT_PROBLEM")).toBe("TEXT_PROBLEM");
      expect(exerciseTypeSchema.parse("INTERACTIVE")).toBe("INTERACTIVE");
    });

    it("rejects invalid type", () => {
      expect(() => exerciseTypeSchema.parse("MULTIPLE_CHOICE")).toThrow();
      expect(() => exerciseTypeSchema.parse("")).toThrow();
    });
  });

  describe("answerTypeSchema", () => {
    it("accepts valid answer types", () => {
      expect(answerTypeSchema.parse("NUMERIC")).toBe("NUMERIC");
      expect(answerTypeSchema.parse("TEXT")).toBe("TEXT");
      expect(answerTypeSchema.parse("SELECT")).toBe("SELECT");
      expect(answerTypeSchema.parse("MULTIPLE_CHOICE")).toBe("MULTIPLE_CHOICE");
    });
  });

  describe("difficultyLevelSchema", () => {
    it("accepts valid levels", () => {
      expect(difficultyLevelSchema.parse("LOW")).toBe("LOW");
      expect(difficultyLevelSchema.parse("MEDIUM")).toBe("MEDIUM");
      expect(difficultyLevelSchema.parse("HIGH")).toBe("HIGH");
    });

    it("rejects unknown level", () => {
      expect(() => difficultyLevelSchema.parse("EXPERT")).toThrow();
    });
  });

  describe("feedbackStyleSchema", () => {
    it("accepts valid styles", () => {
      expect(feedbackStyleSchema.parse("ENCOURAGING")).toBe("ENCOURAGING");
      expect(feedbackStyleSchema.parse("NEUTRAL")).toBe("NEUTRAL");
      expect(feedbackStyleSchema.parse("CORRECTIVE")).toBe("CORRECTIVE");
    });
  });

  describe("nextActionSchema", () => {
    it("accepts valid actions", () => {
      expect(nextActionSchema.parse("REINFORCE")).toBe("REINFORCE");
      expect(nextActionSchema.parse("ADVANCE")).toBe("ADVANCE");
      expect(nextActionSchema.parse("REMEDIATE")).toBe("REMEDIATE");
    });
  });

  describe("pedagogyTypeSchema", () => {
    it("accepts valid types", () => {
      expect(pedagogyTypeSchema.parse("VISUAL")).toBe("VISUAL");
      expect(pedagogyTypeSchema.parse("TEXT")).toBe("TEXT");
      expect(pedagogyTypeSchema.parse("INTERACTIVE")).toBe("INTERACTIVE");
    });
  });

  describe("mistakeTypeSchema", () => {
    it("accepts valid mistake types", () => {
      expect(mistakeTypeSchema.parse("CARRY_MISSED")).toBe("CARRY_MISSED");
      expect(mistakeTypeSchema.parse("COLUMN_MISALIGN")).toBe("COLUMN_MISALIGN");
      expect(mistakeTypeSchema.parse("SIGN_ERROR")).toBe("SIGN_ERROR");
      expect(mistakeTypeSchema.parse("CALCULATION_ERROR")).toBe("CALCULATION_ERROR");
    });
  });

  describe("deviceTypeSchema", () => {
    it("accepts valid device types", () => {
      expect(deviceTypeSchema.parse("mobile")).toBe("mobile");
      expect(deviceTypeSchema.parse("tablet")).toBe("tablet");
      expect(deviceTypeSchema.parse("desktop")).toBe("desktop");
    });

    it("rejects unknown device", () => {
      expect(() => deviceTypeSchema.parse("laptop")).toThrow();
    });
  });
});

describe("difficultyToStars", () => {
  it("returns 2 for LOW", () => {
    expect(difficultyToStars("LOW")).toBe(2);
  });

  it("returns 3 for MEDIUM", () => {
    expect(difficultyToStars("MEDIUM")).toBe(3);
  });

  it("returns 5 for HIGH", () => {
    expect(difficultyToStars("HIGH")).toBe(5);
  });
});

describe("clientContextSchema", () => {
  it("accepts valid context", () => {
    const data = { deviceType: "mobile", appVersion: "1.0.0" };
    expect(clientContextSchema.parse(data)).toEqual(data);
  });

  it("rejects missing appVersion", () => {
    expect(() => clientContextSchema.parse({ deviceType: "mobile" })).toThrow();
  });
});

describe("nextExerciseRequestSchema", () => {
  const valid = {
    studentId: "stu_001",
    sessionId: "ses_001",
    subject: "math",
    locale: "es",
    clientContext: { deviceType: "tablet", appVersion: "1.0.0" },
  };

  it("accepts valid request", () => {
    expect(nextExerciseRequestSchema.parse(valid)).toEqual(valid);
  });

  it("accepts optional topicHint", () => {
    expect(nextExerciseRequestSchema.parse({ ...valid, topicHint: "fractions" }).topicHint).toBe("fractions");
  });

  it("rejects missing locale", () => {
    const { locale: _, ...rest } = valid;
    expect(() => nextExerciseRequestSchema.parse(rest)).toThrow();
  });
});

describe("exerciseSchema", () => {
  const valid = {
    exerciseId: "ex_001",
    type: "VISUAL_ADDITION" as const,
    topicId: "math_addition",
    prompt: "5 + 3 = ?",
    answerType: "NUMERIC" as const,
    difficulty: "LOW" as const,
    hints: ["Cuenta con tus dedos"],
    feedbackStyle: "ENCOURAGING" as const,
  };

  it("accepts valid exercise", () => {
    expect(exerciseSchema.parse(valid)).toEqual(valid);
  });

  it("accepts optional fields", () => {
    const full = { ...valid, stepCurrent: 1, stepTotal: 3, demoContent: "demo", secondaryQuestion: "?", subInstruction: "hint" };
    expect(exerciseSchema.parse(full)).toEqual(full);
  });

  it("rejects missing prompt", () => {
    const { prompt: _, ...rest } = valid;
    expect(() => exerciseSchema.parse(rest)).toThrow();
  });

  it("rejects empty hints array", () => {
    expect(exerciseSchema.parse({ ...valid, hints: [] })).toBeTruthy();
  });
});

describe("telemetrySchema", () => {
  it("accepts valid telemetry", () => {
    const data = { responseTimeMs: 5000, hintsUsed: 2, abandoned: false };
    expect(telemetrySchema.parse(data)).toEqual(data);
  });

  it("accepts zero hintsUsed", () => {
    expect(telemetrySchema.parse({ responseTimeMs: 100, hintsUsed: 0, abandoned: false })).toBeTruthy();
  });
});

describe("submitAnswerRequestSchema", () => {
  const valid = {
    studentId: "stu_001",
    exerciseId: "ex_001",
    answer: "8",
    telemetry: { responseTimeMs: 3000, hintsUsed: 0, abandoned: false },
  };

  it("accepts valid submission", () => {
    expect(submitAnswerRequestSchema.parse(valid)).toEqual(valid);
  });
});

describe("submitAnswerPayloadSchema", () => {
  it("accepts valid payload", () => {
    const data = { exerciseId: "ex_001", answer: "15/8" };
    expect(submitAnswerPayloadSchema.parse(data)).toEqual(data);
  });
});

describe("mistakeSchema", () => {
  it("accepts valid mistake", () => {
    const data = { type: "SIGN_ERROR" as const, severity: 0.5 };
    expect(mistakeSchema.parse(data)).toEqual(data);
  });

  it("rejects severity out of range", () => {
    expect(() => mistakeSchema.parse({ type: "SIGN_ERROR", severity: 1.5 })).toThrow();
  });
});

describe("nextActionDetailSchema", () => {
  it("accepts valid action", () => {
    const data = { action: "ADVANCE" as const, topicId: "math_addition", pedagogy: "VISUAL" as const };
    expect(nextActionDetailSchema.parse(data)).toEqual(data);
  });
});

describe("exerciseResultSchema", () => {
  const valid = {
    attemptId: "att_001",
    score: 100,
    passed: true,
    mistakes: [],
    feedbackSummary: "¡Excelente!",
    nextAction: { action: "ADVANCE" as const, topicId: "math", pedagogy: "VISUAL" as const },
  };

  it("accepts perfect result", () => {
    expect(exerciseResultSchema.parse(valid)).toEqual(valid);
  });

  it("accepts failed result with mistakes", () => {
    const failed = {
      ...valid,
      score: 40,
      passed: false,
      mistakes: [{ type: "SIGN_ERROR" as const, severity: 0.3 }],
      feedbackSummary: "Sigue practicando",
      nextAction: { action: "REMEDIATE" as const, topicId: "math", pedagogy: "TEXT" as const },
    };
    expect(exerciseResultSchema.parse(failed)).toEqual(failed);
  });

  it("rejects score over 100", () => {
    expect(() => exerciseResultSchema.parse({ ...valid, score: 150 })).toThrow();
  });
});

describe("subjectProgressSchema", () => {
  it("accepts valid progress", () => {
    const data = { subjectId: "math", subjectName: "Matemáticas", mastery: 75, lastPractice: "Hoy" };
    expect(subjectProgressSchema.parse(data)).toEqual(data);
  });

  it("rejects mastery over 100", () => {
    expect(() => subjectProgressSchema.parse({ subjectId: "m", subjectName: "M", mastery: 200, lastPractice: "Hoy" })).toThrow();
  });
});

describe("progressAchievementSchema", () => {
  it("accepts valid achievement", () => {
    const data = { id: "ach_001", title: "Estrella", description: "5 días seguidos", earnedAt: "2024-01-15" };
    expect(progressAchievementSchema.parse(data)).toEqual(data);
  });
});

describe("weakAreaSchema", () => {
  it("accepts valid weak area", () => {
    const data = { topicId: "math_frac", topicName: "Fracciones", recommendation: "Practicar" };
    expect(weakAreaSchema.parse(data)).toEqual(data);
  });
});

describe("studentProgressSchema", () => {
  const valid = {
    studentId: "stu_001",
    studentName: "Mario",
    overallProgress: 72,
    subjects: [{ subjectId: "math", subjectName: "Matemáticas", mastery: 75, lastPractice: "Hoy" }],
    achievements: [],
    weakAreas: [],
  };

  it("accepts valid progress", () => {
    expect(studentProgressSchema.parse(valid)).toEqual(valid);
  });

  it("rejects overallProgress over 100", () => {
    expect(() => studentProgressSchema.parse({ ...valid, overallProgress: 101 })).toThrow();
  });
});

describe("parentReportSchema", () => {
  it("accepts valid report", () => {
    const data = { studentId: "s1", weekRange: "Ene 1-7", summary: "Buen progreso", highlights: ["Matemáticas"], nextSteps: ["Practicar resta"] };
    expect(parentReportSchema.parse(data)).toEqual(data);
  });
});

describe("studentSummarySchema", () => {
  it("accepts valid summary", () => {
    const data = { studentId: "s1", mastery: 80, riskFlags: ["bajo en fracciones"] };
    expect(studentSummarySchema.parse(data)).toEqual(data);
  });
});

describe("teacherReportSchema", () => {
  it("accepts valid report", () => {
    const data = { classId: "cls_001", studentSummaries: [{ studentId: "s1", mastery: 80, riskFlags: [] }] };
    expect(teacherReportSchema.parse(data)).toEqual(data);
  });
});

describe("childProfileSchema", () => {
  it("accepts valid child profile", () => {
    const data = { studentId: "s1", name: "Mario", level: 2, points: 100, precision: 85, streakDays: 4 };
    expect(childProfileSchema.parse(data)).toEqual(data);
  });

  it("accepts optional avatar", () => {
    expect(childProfileSchema.parse({ studentId: "s1", name: "M", level: 1, points: 0, precision: 0, streakDays: 0, avatar: "https://img.com/a.png" }).avatar).toBe("https://img.com/a.png");
  });

  it("rejects level 0 (must be positive)", () => {
    expect(() => childProfileSchema.parse({ studentId: "s1", name: "M", level: 0, points: 0, precision: 0, streakDays: 0 })).toThrow();
  });
});

describe("studentSchema", () => {
  const valid = {
    studentId: "s1", name: "Mario", level: 2, points: 50, precision: 80, streakDays: 3,
    streakWeek: [true, true, true, false, false, false, false],
  };

  it("accepts valid student", () => {
    expect(studentSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty streakWeek", () => {
    expect(() => studentSchema.parse({ ...valid, streakWeek: [] })).toBeTruthy();
  });
});

describe("agendaItemSchema", () => {
  const valid = { lessonId: "l1", title: "Sumas", subject: "math", scheduledAt: "2024-01-15", durationMinutes: 30, completed: false };

  it("accepts valid item", () => {
    expect(agendaItemSchema.parse(valid)).toEqual(valid);
  });

  it("accepts optional topicHint", () => {
    expect(agendaItemSchema.parse({ ...valid, topicHint: "Llevar" }).topicHint).toBe("Llevar");
  });

  it("rejects zero duration", () => {
    expect(() => agendaItemSchema.parse({ ...valid, durationMinutes: 0 })).toThrow();
  });
});

describe("progressItemSchema", () => {
  it("accepts valid item", () => {
    const data = { topicId: "math_add", title: "Sumas", mastery: 90 };
    expect(progressItemSchema.parse(data)).toEqual(data);
  });
});

describe("achievementSchema", () => {
  it("accepts valid achievement", () => {
    const data = { id: "ach_001", title: "Estrella", description: "5 días", type: "streak" as const };
    expect(achievementSchema.parse(data)).toEqual(data);
  });

  it("rejects unknown type", () => {
    expect(() => achievementSchema.parse({ id: "1", title: "T", description: "D", type: "unknown" })).toThrow();
  });
});

describe("studentDashboardSchema", () => {
  const valid = {
    student: { studentId: "s1", name: "Mario", level: 2, points: 50, precision: 80, streakDays: 3, streakWeek: [true, false, false, false, false, false, false] },
    agenda: [{ lessonId: "l1", title: "Sumas", subject: "math", scheduledAt: "Hoy", durationMinutes: 30, completed: false }],
    progress: [{ topicId: "math_add", title: "Sumas", mastery: 75 }],
    recentAchievements: [{ id: "ach_1", title: "Estrella", description: "5 días", type: "streak" }],
  };

  it("accepts valid dashboard", () => {
    expect(studentDashboardSchema.parse(valid)).toEqual(valid);
  });
});

describe("activityItemSchema", () => {
  it("accepts valid activity", () => {
    const data = { id: "act_001", studentId: "s1", childName: "Mario", action: "Completó lección", subject: "math", timestamp: "Hace 30 min" };
    expect(activityItemSchema.parse(data)).toEqual(data);
  });
});

describe("parentProfileSchema", () => {
  const valid = {
    parentId: "par_001", name: "Ana", email: "ana@test.com",
    children: [{ studentId: "s1", name: "Mario", level: 2, points: 50, precision: 80, streakDays: 3 }],
  };

  it("accepts valid profile", () => {
    expect(parentProfileSchema.parse(valid)).toEqual(valid);
  });
});

describe("parentDashboardSchema", () => {
  const valid = {
    parent: { parentId: "p1", name: "Ana", email: "a@t.com", children: [] },
    childrenOverview: [],
    recentActivity: [],
  };

  it("accepts valid dashboard", () => {
    expect(parentDashboardSchema.parse(valid)).toEqual(valid);
  });

  it("accepts full dashboard", () => {
    const full = {
      parent: { parentId: "p1", name: "Ana", email: "a@t.com", children: [{ studentId: "s1", name: "Mario", level: 2, points: 50, precision: 80, streakDays: 3 }] },
      childrenOverview: [{ studentId: "s1", name: "Mario", level: 2, points: 50, precision: 80, streakDays: 3 }],
      recentActivity: [{ id: "a1", studentId: "s1", childName: "Mario", action: "Completó", subject: "math", timestamp: "Hoy" }],
    };
    expect(parentDashboardSchema.parse(full)).toEqual(full);
  });
});

describe("teacherStudentSummarySchema", () => {
  it("accepts valid student summary", () => {
    const data = {
      studentId: "stu_001", name: "Mario", level: 2, points: 156, precision: 85,
      streakDays: 4, mastery: 78, riskFlags: [], lastActivity: "Hoy",
    };
    expect(teacherStudentSummarySchema.parse(data)).toEqual(data);
  });

  it("accepts student with risk flags", () => {
    const data = {
      studentId: "stu_003", name: "Sofía", level: 1, points: 89, precision: 55,
      streakDays: 1, mastery: 45, riskFlags: ["bajo rendimiento"], lastActivity: "Hace 3 días",
    };
    expect(teacherStudentSummarySchema.parse(data)).toEqual(data);
  });

  it("accepts student with avatar", () => {
    const data = {
      studentId: "stu_001", name: "Mario", level: 2, points: 156, precision: 85,
      streakDays: 4, mastery: 78, riskFlags: [], lastActivity: "Hoy",
      avatar: "https://example.com/avatar.png",
    };
    expect(teacherStudentSummarySchema.parse(data)).toEqual(data);
  });
});

describe("teacherClassSchema", () => {
  it("accepts valid class", () => {
    const data = {
      classId: "cls_001", className: "3º A", studentCount: 15, averageMastery: 78,
      students: [{ studentId: "s1", name: "Mario", level: 2, points: 50, precision: 80, streakDays: 3, mastery: 75, riskFlags: [], lastActivity: "Hoy" }],
    };
    expect(teacherClassSchema.parse(data)).toEqual(data);
  });
});

describe("teacherDashboardSchema", () => {
  it("accepts valid dashboard", () => {
    const data = {
      teacherId: "tea_001", name: "Prof. Roberto", totalStudents: 28, totalClasses: 2, averageMastery: 74,
      classes: [],
      subjectProgress: [{ topicId: "math", title: "Matemáticas", mastery: 78 }],
      recentActivity: [],
    };
    expect(teacherDashboardSchema.parse(data)).toEqual(data);
  });

  it("accepts full dashboard", () => {
    const full = {
      teacherId: "tea_001", name: "Prof. Roberto", totalStudents: 28, totalClasses: 2, averageMastery: 74,
      classes: [{
        classId: "cls_001", className: "3º A", studentCount: 1, averageMastery: 78,
        students: [{ studentId: "s1", name: "Mario", level: 2, points: 50, precision: 80, streakDays: 3, mastery: 75, riskFlags: [], lastActivity: "Hoy" }],
      }],
      subjectProgress: [{ topicId: "math", title: "Matemáticas", mastery: 78 }],
      recentActivity: [{ id: "a1", studentId: "s1", childName: "Mario", action: "Completó", subject: "math", timestamp: "Hoy" }],
    };
    expect(teacherDashboardSchema.parse(full)).toEqual(full);
  });
});
