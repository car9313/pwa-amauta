import type { Course } from "./types";


export const SAMPLE_COURSE: Course = {
  id: 'math-adventures-1',
  title: 'Aventuras Matemáticas',
  units: [
    {
      id: 'unit-1',
      title: 'Los Números Amigos',
      lessons: [
        {
          id: 'lesson-1-1',
          title: 'El número 1 y 2',
          description: 'Conoce a tus primeros amigos numéricos.',
          topic: 'Números Básicos',
          icon: '🔢',
          steps: [
            {
              id: 'step-1',
              type: 'explain',
              title: '¡Hola! Soy el número 1',
              content: 'El número 1 representa una sola cosa. ¡Mira esta manzana!',
              imageUrl: 'https://picsum.photos/seed/apple1/400/300'
            },
            {
              id: 'step-2',
              type: 'mcq',
              title: '¿Cuántos hay?',
              content: '¿Cuántos soles ves en la imagen?',
              imageUrl: 'https://picsum.photos/seed/sun1/400/300',
              options: [
                { id: 'opt-1', text: '1', isCorrect: true },
                { id: 'opt-2', text: '2', isCorrect: false },
                { id: 'opt-3', text: '3', isCorrect: false }
              ]
            }
          ]
        },
        {
          id: 'lesson-1-2',
          title: 'Contando hasta 5',
          description: '¡Vamos a contar más dedos!',
          topic: 'Conteo',
          icon: '🖐️',
          steps: [
            {
              id: 'step-3',
              type: 'explain',
              title: 'Tus manos',
              content: 'En una mano tienes 5 dedos. Vamos a contarlos juntos.',
              imageUrl: 'https://picsum.photos/seed/hand5/400/300'
            }
          ]
        },
        {
          id: 'lesson-1-3',
          title: 'Suma Básica',
          description: '1 + 1 es...',
          topic: 'Sumas',
          icon: '➕',
          steps: []
        }
      ]
    },
    {
      id: 'unit-2',
      title: 'Formas y Colores',
      lessons: [
        {
          id: 'lesson-2-1',
          title: 'El Círculo Rojo',
          description: 'Redondo como una pelota.',
          topic: 'Formas',
          icon: '⭕',
          steps: []
        }
      ]
    }
  ]
};