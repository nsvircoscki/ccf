import { useState } from 'react';
import { motion } from 'framer-motion';

function App() {
  const [projetos] = useState([
    { id: 1, titulo: 'Casa de Campo', status: 'Iniciar' }
  ]);

  return (
    <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '132px', fontFamily: 'Roboto' }}>
      
      {/* BLOCO 1: Barra superior e Botão (Igual ao Figma) */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ width: '280px', height: '45px', background: '#CCCBCB', borderRadius: '20px', display: 'flex', alignItems: 'center', padding: '0 20px', color: '#787373', fontWeight: '700' }}>
          Selecione o projeto:
        </div>
        <div style={{ width: '45px', height: '45px', background: '#CCCBCB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#787373', fontSize: '24px', fontWeight: '700', cursor: 'pointer' }}>
          +
        </div>
      </div>

      {/* BLOCO 2: As 3 Colunas (Com a lógica de renderização) */}
      <div style={{ display: 'flex', gap: '30px' }}>
        {['Iniciar', 'Em Andamento', 'Concluído'].map((status) => (
          <div key={status} style={{ width: '374px', minHeight: '662px', background: '#CCCBCB', borderRadius: '20px', padding: '20px' }}>
             
             {/* Cabeçalho da Coluna com o Ponto de Status */}
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ 
                  width: '30px', height: '28px', borderRadius: '99px', 
                  background: status === 'Iniciar' ? '#FF5252' : status === 'Em Andamento' ? '#FFF600' : '#22C55E' 
                }} />
                <h2 style={{ color: '#787373', fontSize: '24px', margin: 0 }}>{status}</h2>
             </div>

             {/* Renderização dos cartões dentro desta coluna */}
             {projetos.filter(p => p.status === status).map(p => (
               <motion.div 
                 key={p.id} 
                 drag dragSnapToOrigin={true}
                 style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0px 0px 9.6px rgba(0,0,0,0.3)', cursor: 'grab' }}
               >
                 {p.titulo}
               </motion.div>
             ))}
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;