export async function onRequestGet(context: { env: any }): Promise<Response> {
  try {
    const { env } = context;

    // List all objects in the bucket. We don't assume a fixed prefix so
    // that you can upload models at the root of the bucket.
    const objects = await env.piper.list();

    // Filter for .onnx.json files and extract model names
    const models = objects.objects
      .filter((obj) => obj.key.endsWith('.onnx.json'))
      .map((obj) => {
        // Take the filename and strip the .onnx.json suffix
        const parts = obj.key.split('/');
        const file = parts[parts.length - 1] || '';
        return file.replace(/\.onnx\.json$/, '');
      })
      .filter((name) => name.length > 0) // Filter out empty names
      .sort(); // Sort alphabetically

    return new Response(JSON.stringify({ models }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error listing models:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list models', message: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

