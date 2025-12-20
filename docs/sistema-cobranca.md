# Sistema de Cobrança Automática com IA

## O que foi implementado?

Agora a aplicação possui um sistema completo de cobrança automática com memória da IA. A Mariana (sua assistente de IA) consegue:

1. **Lembrar de conversas anteriores** - Mantém histórico completo de todas as conversas com cada cliente
2. **Conhecer detalhes dos clientes** - Sabe automaticamente quanto cada cliente deve, data de vencimento, número da fatura, etc.
3. **Negociar automaticamente** - Usa as informações do cliente para negociar o pagamento de forma inteligente

## Como funciona?

### 1. Banco de Dados

Foram criadas duas novas tabelas:

- **customers** - Armazena dados dos clientes devedores (nome, telefone, valor devido, data de vencimento, etc.)
- **conversation_history** - Guarda todo o histórico de conversas para a IA ter memória

### 2. Fluxo Automático

Quando um cliente envia uma mensagem no WhatsApp:

1. O sistema busca os dados do cliente no banco
2. Busca as últimas 10 mensagens da conversa
3. A IA recebe automaticamente:
   - Nome do cliente
   - Valor devido
   - Data de vencimento
   - Número da fatura
   - Histórico completo da conversa
4. A IA responde de forma personalizada usando essas informações
5. A conversa é salva no histórico automaticamente

### 3. Nova Aba: Clientes

Foi criada uma nova aba "Clientes" onde você pode:

- Ver todos os clientes cadastrados
- Adicionar novos clientes manualmente
- Importar clientes em massa via CSV
- Editar informações dos clientes
- Excluir clientes
- Ver status de cada cliente (Pendente, Negociando, Pago, Vencido)

## Como usar?

### Passo 1: Adicionar Clientes

Você tem duas opções:

#### Opção A: Adicionar Manualmente

1. Vá na aba "Clientes"
2. Clique em "+ Adicionar Cliente"
3. Preencha os dados:
   - **Telefone**: Formato `5511999999999@s.whatsapp.net`
   - **Nome**: Nome do cliente
   - **Valor Devido**: Quanto o cliente deve em R$
   - **Data de Vencimento**: Quando vence o pagamento
   - **Número da Fatura**: Identificação da cobrança
   - **Observações**: Notas adicionais
   - **Status**: Pendente/Negociando/Pago/Vencido
4. Clique em "Salvar"

#### Opção B: Importar CSV

1. Prepare um arquivo CSV com as colunas:
   ```
   phone,name,amount_due,due_date,invoice_number,notes,status
   ```

2. Exemplo de linha:
   ```
   5511999999999@s.whatsapp.net,João Silva,150.50,2024-12-25,INV-001,Cliente antigo,pending
   ```

3. Na aba "Clientes", clique em "Importar CSV"
4. Selecione seu arquivo
5. Pronto! Todos os clientes serão importados

**Dica**: Use o arquivo `exemplo-clientes.csv` que está na raiz do projeto como modelo!

### BAIXA AUTOMÁTICA

Quando você importar uma nova lista de clientes, o sistema automaticamente:

1. **Compara** com a lista anterior
2. **Identifica** clientes que não estão mais na nova lista
3. **Marca como "PAGO"** automaticamente
4. **Adiciona uma nota** com a data da baixa automática

**Exemplo prático:**

- Você importa uma lista com João, Maria e Pedro
- Na semana seguinte, Maria pagou e você importa uma nova lista só com João e Pedro
- O sistema automaticamente marca Maria como "PAGO" e adiciona a nota: "[2024-12-20] Marcado como pago automaticamente - removido da lista de devedores"

Isso facilita muito a gestão! Você só precisa importar a lista atual de devedores e o sistema cuida de dar baixa em quem pagou.

### Passo 2: Configurar a IA

1. Vá na aba "Configurações"
2. Configure o prompt da IA, por exemplo:
   ```
   Você é a Mariana, assistente de cobrança da empresa XYZ.
   Seu trabalho é cobrar clientes de forma educada mas firme.
   Sempre mencione o valor devido e a data de vencimento.
   Ofereça opções de parcelamento se o cliente pedir.
   Seja profissional mas amigável.
   ```
3. Ative a "Resposta Automática"
4. Clique em "Salvar Configurações"

### Passo 3: Conectar o WhatsApp

1. Vá na aba "Conexão"
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR Code com seu WhatsApp
4. Aguarde até o status ficar "Conectado"

### Passo 4: Pronto!

Agora quando qualquer cliente cadastrado enviar uma mensagem, a IA irá:

1. Reconhecer automaticamente quem é
2. Saber quanto ele deve
3. Ver todo o histórico de conversas anteriores
4. Responder de forma personalizada para cobrar o pagamento

## Controle Manual de Conversas

Na aba "Conversas", você tem controle total sobre as interações:

### Pausar/Retomar a IA

Você pode pausar a IA para qualquer conversa específica e assumir o controle manual:

1. **Acesse a aba "Conversas"**
2. **Selecione uma conversa** da lista à esquerda
3. **Clique no botão "⏸️ Pausar IA"** no topo da conversa

Quando a IA está pausada:
- Um aviso amarelo aparece: "⏸️ IA pausada - Você está no controle manual desta conversa"
- A IA **NÃO** responderá automaticamente às mensagens desse cliente
- Você pode responder manualmente usando o campo de entrada

Para retomar a IA:
- Clique em "▶️ Retomar IA"
- A IA voltará a responder automaticamente

### Responder Manualmente

Mesmo com a IA ativa, você pode enviar mensagens manuais a qualquer momento:

1. **Selecione a conversa** na lista
2. **Digite sua mensagem** no campo de texto na parte inferior
3. **Pressione Enter** ou clique em "📤 Enviar"

**Dica:** É recomendado pausar a IA antes de responder manualmente para evitar que a IA e você respondam ao mesmo tempo.

### Interface de Conversas

A nova interface mostra:
- **Lista de conversas** à esquerda com nome do cliente e telefone
- **Badge ⏸️** indica conversas com IA pausada
- **Histórico completo** da conversa selecionada
- **Campo de entrada** para mensagens manuais
- **Botão de pause/resume** para controlar a IA

## Exemplo de Conversa

**Cliente (João Silva):** Oi, bom dia!

**IA Mariana:** Olá João! Bom dia! 😊

Estou entrando em contato porque vi que você tem um pagamento pendente no valor de R$ 150,50 referente à fatura INV-001, com vencimento em 25/12/2024.

Como podemos resolver essa situação?

**Cliente:** Posso pagar semana que vem?

**IA Mariana:** Entendo João. A fatura está com vencimento para 25/12/2024. Você conseguiria fazer o pagamento até essa data? Se precisar, posso verificar opções de parcelamento também.

## Campos dos Clientes

- **phone**: Número do WhatsApp completo (com @s.whatsapp.net)
- **name**: Nome completo do cliente
- **amount_due**: Valor em reais que o cliente deve
- **due_date**: Data de vencimento (formato YYYY-MM-DD)
- **invoice_number**: Número da fatura/boleto para referência
- **notes**: Observações sobre o cliente (histórico, acordos, etc.)
- **status**:
  - `pending` - Pagamento pendente
  - `negotiating` - Em negociação
  - `paid` - Pago
  - `overdue` - Vencido

## Dicas Importantes

1. **Formato do Telefone**: Sempre use o formato completo `5511999999999@s.whatsapp.net`
   - `55` = Código do Brasil
   - `11` = DDD
   - `999999999` = Número do celular
   - `@s.whatsapp.net` = Sufixo obrigatório

2. **Memória da IA**: A IA lembra das últimas 10 mensagens de cada conversa. Isso permite negociações contínuas.

3. **Status dos Clientes**: Atualize o status conforme a negociação avança:
   - Cliente respondeu? → Mude para "Negociando"
   - Cliente pagou? → Mude para "Pago"
   - Venceu e não pagou? → Mude para "Vencido"

4. **Observações**: Use o campo "Observações" para anotar informações importantes que a IA pode usar, como:
   - "Cliente sempre paga, só precisa lembrar"
   - "Preferência por PIX"
   - "Solicitar comprovante após pagamento"

## Próximos Passos

Agora você pode:

1. Importar sua base de clientes devedores
2. Deixar a IA trabalhar automaticamente
3. Acompanhar as conversas na aba "Conversas"
4. Atualizar o status dos clientes conforme pagam
5. Ajustar o prompt da IA se necessário

Boa sorte com suas cobranças automatizadas! 🚀
