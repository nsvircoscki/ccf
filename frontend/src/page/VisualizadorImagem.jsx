import { useEffect, useState } from 'react';

// Exibe a imagem do serviço a partir de um arquivo local recém-selecionado
// (`arquivo`) ou da imagem já salva no servidor (`url`). O arquivo local tem
// prioridade: é a alteração que o usuário acabou de fazer na tela.
export default function VisualizadorImagem({ arquivo, url }) {
  const [urlLocal, setUrlLocal] = useState(null);

  useEffect(() => {
    // Sem arquivo local não há nada a criar; urlLocal fica como está porque
    // nesse caso ele nem é lido (ver `endereco` abaixo).
    if (!arquivo) return undefined;

    const criada = URL.createObjectURL(arquivo);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincronizar com a API de object URL é o caso de uso legítimo de um efeito
    setUrlLocal(criada);

    // Criar e revogar precisam ficar no mesmo efeito. Com a criação isolada num
    // useMemo, o StrictMode revogava a URL na primeira limpeza e não recriava na
    // segunda montagem, deixando a <img> apontando para um blob morto.
    return () => URL.revokeObjectURL(criada);
  }, [arquivo]);

  const endereco = arquivo ? urlLocal : url;
  if (!endereco) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0F172A',
        height: '100%',
        width: '100%',
      }}
    >
      <img
        src={endereco}
        alt="Imagem do serviço"
        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}
