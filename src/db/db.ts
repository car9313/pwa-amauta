import Dexie from 'dexie';

export interface User {
  id?: number;
  email: string;
  name: string;
  // podrías agregar password si lo necesitas
}

export interface ChildProfile {
  id?: number;
  userId: number;
  name: string;
  avatar: string;
  totalPoints: number;
  totalStars: number;
}

export class AppDatabase extends Dexie {
  users!: Dexie.Table<User, number>;
  childProfiles!: Dexie.Table<ChildProfile, number>;

  constructor() {
    super('AmautaDB');
    this.version(1).stores({
      users: '++id, email',
      childProfiles: '++id, userId, name'
    });
  }
}

export const db = new AppDatabase();

// Función de semilla (opcional)
export async function seedDatabase() {
  const userCount = await db.users.count();
  if (userCount === 0) {
    const userId = await db.users.add({
      email: 'parent@example.com',
      name: 'Padre Amauta'
    });
    await db.childProfiles.bulkAdd([
      { userId, name: 'Ana', avatar: '/avatars/ana.png', totalPoints: 0, totalStars: 0 },
      { userId, name: 'Carlos', avatar: '/avatars/carlos.png', totalPoints: 0, totalStars: 0 },
      { userId, name: 'Lucía', avatar: '/avatars/lucia.png', totalPoints: 0, totalStars: 0 }
    ]);
  }
}