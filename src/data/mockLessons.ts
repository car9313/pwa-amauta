export interface Lesson {
  id: string
  title: string
  contentUrl: string
  images: string[]
  audios: string[]
}

// simulación de base de datos
export const mockLessons: Lesson[] = [
  {
    id: 'math-1',
    title: 'Números del 1 al 10',
    contentUrl: '/lessons/math-1.json',
    images: [
      '/assets/img/one.png',
      '/assets/img/two.png'
    ],
    audios: [
      '/assets/audio/one.mp3',
      '/assets/audio/two.mp3'
    ]
  },
  {
    id: 'abc-1',
    title: 'Aprendiendo el abecedario',
    contentUrl: '/lessons/abc-1.json',
    images: [
      '/assets/img/a.png',
      '/assets/img/b.png'
    ],
    audios: [
      '/assets/audio/a.mp3'
    ]
  }
]