import { FluxContext } from 'flux-oriented-architecture';

export default async function listProducts(ctx: FluxContext) {
  const result = await ctx.plugins.db.query('SELECT * FROM products ORDER BY created_at DESC');
  return result.rows;
}
