import { mockLessons } from '../data/mockLessons'

export function getLessonAssets(lessonId: string): string[] {
  const lesson = mockLessons.find(l => l.id === lessonId)

  if (!lesson) return []

  return [
    lesson.contentUrl,
    ...lesson.images,
    ...lesson.audios
  ]
}