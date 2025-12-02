import { FluxContext } from 'flux-oriented-architecture';

export default async function createProduct(ctx: FluxContext) {
  const { name, price, description } = ctx.input;

  if (!name || !price) {
    throw new Error('Name and Price are required');
  }

  const query = `
    INSERT INTO products (name, price, description)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const result = await ctx.plugins.db.query(query, [name, price, description]);
  return result.rows[0];
}
