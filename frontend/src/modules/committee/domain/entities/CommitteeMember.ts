export interface CommitteeMember {
  id: number;
  usuarioId: number;
  nombre: string;
  usuario: string;
  rol: 'Presidente' | 'Secretario' | 'Vocal';
  fechaRegistro?: string | null;
}
