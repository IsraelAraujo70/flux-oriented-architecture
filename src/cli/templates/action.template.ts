export default async function (context: any) {
  // Action logic here
  const { input } = context;

  console.log('Action executed', input);

  return {
    success: true,
    data: input
  };
}
