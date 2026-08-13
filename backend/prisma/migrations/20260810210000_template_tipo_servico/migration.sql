-- Tabela editável de associação entre templates de documento e tipos de
-- serviço. Um template sem nenhuma linha aqui é "geral" e aparece para
-- qualquer tipo. Populada com um rascunho inicial baseado no nome dos
-- templates (revisável depois pela tela de configuração).

CREATE TABLE "TemplateTipoServico" (
    "id" TEXT NOT NULL,
    "templateChave" TEXT NOT NULL,
    "tipoServico" TEXT NOT NULL,

    CONSTRAINT "TemplateTipoServico_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TemplateTipoServico_templateChave_tipoServico_key" ON "TemplateTipoServico"("templateChave", "tipoServico");

INSERT INTO "TemplateTipoServico" ("id", "templateChave", "tipoServico") VALUES
  ('seed-tts-0001', 'retificacao_risbs', 'Retificação'),
  ('seed-tts-0002', 'retificacao_pmsbs', 'Retificação'),
  ('seed-tts-0003', 'memorial_descritivo_retificacao', 'Retificação'),
  ('seed-tts-0004', 'declaracao_diferencas_medidas', 'Retificação'),
  ('seed-tts-0005', 'unificacao_risbs', 'Unificação'),
  ('seed-tts-0006', 'unificacao_pmsbs', 'Unificação'),
  ('seed-tts-0007', 'parcelamento_solo_risbs', 'Desmembramento'),
  ('seed-tts-0008', 'parcelamento_solo_pmsbs', 'Desmembramento'),
  ('seed-tts-0009', 'consulta_previa_pmsbs', 'Desmembramento'),
  ('seed-tts-0010', 'atualizacao_confrontacoes_risbs', 'Alteração de Divisas');
