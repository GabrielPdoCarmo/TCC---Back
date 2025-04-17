import { api } from '../api'; // Ajuste o caminho conforme necessário

// Login
export const login = async (email: string, senha: string) => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Erro ao fazer login' };
  }
};

// Pets
export const getPets = async () => {
  const response = await api.get('/pets');
  return response.data;
};

// Estados
export const getEstados = async () => {
  const response = await api.get('/estados');
  return response.data;
};

// Cidades por estado
export const getCidadesPorEstado = async (estadoId: number) => {
  const response = await api.get(`/cidades?estadoId=${estadoId}`);
  return response.data;
};

// Usuários (POST)
export const postUsuarios = async (usuario: any) => {
  const response = await api.post('/usuarios', usuario);
  return response.data;
};

// Faixa etária
export const getFaixaEtaria = async () => {
  const response = await api.get('/faixa-etaria');
  return response.data;
};

// Status
export const getStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

// Doenças e deficiências
export const getDoencasDeficiencias = async () => {
  const response = await api.get('/doencasdeficiencias');
  return response.data;
};

// Espécies
export const getEspecies = async () => {
  const response = await api.get('/especies');
  return response.data;
};

// Raças
export const getRacas = async () => {
  const response = await api.get('/racas');
  return response.data;
};

// Favoritos
export const getFavoritos = async () => {
  const response = await api.get('/favoritos');
  return response.data;
};

// Sexo do usuário
export const getSexoUsuario = async () => {
  const response = await api.get('/sexoUsuario');
  return response.data;
};
