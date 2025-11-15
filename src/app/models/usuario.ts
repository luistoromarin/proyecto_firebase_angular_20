export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  fotoUrl?: string;
  fechaCreacion: Date;
  ultimaConexion: Date;
  // Campos opcionales
  genero?: 'masculino' | 'femenino' | 'otro' | 'prefiero-no-decir';
  edad?: number;
  situacionLaboral?: 'empleado' | 'desempleado' | 'estudiante' | 'jubilado' | 'autonomo' | 'otro';
}