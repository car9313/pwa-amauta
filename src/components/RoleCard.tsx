type RoleCardProps = {
  title: string;
  highlight?: string;
  image: string;
  onClick: () => void;
};

export function RoleCard({ title, highlight, image, onClick }: RoleCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition"
    >
      <img src={image} className="w-16 h-16 rounded-xl object-cover" />

      <p className="text-lg font-semibold text-gray-800">
        {title}{' '}
        {highlight && <span className="text-secondary">{highlight}</span>}
      </p>
    </div>
  );
}
export function RoleSelectionPage() {
  return (
    <div className="min-h-screen bg-muted flex flex-col items-center p-4">
      
      {/* Header */}
      <header className="w-full flex justify-between items-center mb-6">
        <span className="font-bold text-primary text-lg">Amauta</span>
        <div className="w-10 h-10 bg-primary rounded-full" />
      </header>

      {/* Hero */}
      <div className="text-center mb-6">
        <img src="/mascot.png" className="w-32 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-primary">
          ¡Hola! Soy Amauta.
        </h1>
        <p className="text-gray-500">¿Quién eres?</p>
      </div>

      {/* Roles */}
      <div className="w-full flex flex-col gap-4">
        <RoleCard
          title="Soy"
          highlight="Estudiante"
          image="/student.jpg"
          onClick={() => console.log('student')}
        />

        <RoleCard
          title="Soy"
          highlight="Padre o Madre"
          image="/parent.jpg"
          onClick={() => console.log('parent')}
        />
      </div>

    </div>
  );
}