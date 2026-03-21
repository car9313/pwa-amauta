import { useState } from 'react'
import { mockLessons } from '../data/mockLessons'
import { getLessonAssets } from '../services/lessonAssets'
import { DownloadLesson } from '../components/DownloadLesson'

export function LessonPage() {
  const [selectedLessonId, setSelectedLessonId] = useState<string>('math-1')

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-bold">Lecciones</h2>

      <select
        value={selectedLessonId}
        onChange={e => setSelectedLessonId(e.target.value)}
        className="border p-2 rounded"
      >
        {mockLessons.map(lesson => (
          <option key={lesson.id} value={lesson.id}>
            {lesson.title}
          </option>
        ))}
      </select>

      <DownloadLesson
        lessonId={selectedLessonId}
        getLessonAssets={getLessonAssets}
      />
    </div>
  )
}