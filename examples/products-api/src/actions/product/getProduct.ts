import { FluxContext } from 'flux-oriented-architecture';

export default async function getProduct(ctx: FluxContext) {
  const { id } = ctx.args || ctx.input;

  if (!id) {
    throw new Error('Product ID is required');
  }

  const result = await ctx.plugins.db.query('SELECT * FROM products WHERE id = $1', [id]);

  if (result.rows.length === 0) {
    const error: any = new Error('Product not found');
    error.statusCode = 404;
    throw error;
  }

  return result.rows[0];
}
