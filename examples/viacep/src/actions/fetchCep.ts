type FluxContext = any;

export default async function fetchCep(context: FluxContext) {
  const cep = (context.input?.cep || '').replace(/\D/g, '');
  if (!cep || cep.length !== 8) {
    throw new Error('CEP inválido. Use 8 dígitos.');
  }

  const url = `https://viacep.com.br/ws/${cep}/json/`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Erro ao consultar ViaCEP: ${res.status}`);
  }
  const data = await res.json();

  if ((data as any).erro) {
    throw new Error('CEP não encontrado');
  }

  return data;
}
