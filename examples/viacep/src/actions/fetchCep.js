// CJS-friendly action; dynamic import will pick module.exports as default
module.exports = async function fetchCep(context) {
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

  if (data.erro) {
    throw new Error('CEP não encontrado');
  }

  return data;
};
