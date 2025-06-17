# ADR-002: Estratégia de Cache para Sumários de Transações

## Status
✅ Aprovado - 2023-11-20

## Contexto
O endpoint `/transactions/summary` apresenta:
- Alta frequência de acesso
- Cálculo custoso (agregação em grande volume de dados)
- Dados que não requerem atualização em tempo real

## Decisão
Implementamos estratégia de cache com as seguintes características:

### Tecnologia
- **Redis** como camada de cache distribuído
- **TTL (Time-To-Live)** de 60 segundos
- **Invalidação** ativa em escritas

### Padrões de Chave
```typescript
`summary:${sessionId}`