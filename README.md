# Transactions API

## Estilo de Código

### TypeScript
- Interfaces prefixadas com `I` (opcional)
- Tipos em PascalCase
- Use `type` para uniões/intersecções
- Use `interface` para formas de objetos

### Exemplo de Controller
```typescript
export class TransactionsController {
  constructor(
    private readonly service: TransactionsService
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    // ... implementação
  }
}
```

### Convenções
1. Banco de dados:
   - Tabelas no plural (`transactions`)
   - Snake_case para colunas

2. Cache:
   - Chaves no formato `type:id` (ex: `summary:session-123`)
   - TTL padrão de 60s

## Rotas Principais
| Método | Rota            | Descrição               |
|--------|-----------------|-------------------------|
| POST   | /transactions   | Cria nova transação     |
| GET    | /transactions   | Lista transações        |
| GET    | /transactions/:id | Obtém transação específica |