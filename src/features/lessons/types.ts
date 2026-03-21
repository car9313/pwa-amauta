export type StepType = 'explain' | 'mcq' | 'interactive';

export interface LessonStep {
  id: string;
  type: StepType;
  title: string;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  correctAnswerId?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  topic: string;
  icon: string;
  steps: LessonStep[];
}

export interface Unit {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  units: Unit[];
}