// export async function onRequestGet(context: {
//   env: {
//     piper: R2Bucket;
//   };
//   params: {
//     name: string;
//   };
// }): Promise<Response> {
//   try {
//     const { env, params } = context;
//     // Decode in case the frontend sent encodeURIComponent for spaces/special chars
//     const fileName = decodeURIComponent(params.name || '');
    
//     if (!fileName) {
//       return new Response('File name is required', { status: 400 });
//     }

//     // Try multiple possible locations so users can upload models with
//     // different folder layouts inside the bucket.
//     const candidateKeys = [
//       fileName,                      // root
//       `piper/vi/${fileName}`,        // recommended layout
//       `tts-model/vi/${fileName}`,    // mirrors old public path
//       `vi/${fileName}`,              // simple language folder
//     ];

//     let object: R2ObjectBody | null = null;
//     let usedKey = '';
//     for (const key of candidateKeys) {
//       // eslint-disable-next-line no-await-in-loop
//       const maybe = await env.piper.get(key);
//       if (maybe) {
//         object = maybe;
//         usedKey = key;
//         break;
//       }
//     }
    
//     if (!object) {
//       return new Response('Model file not found', { status: 404 });
//     }
    
//     // Determine content type based on file extension
//     let contentType = 'application/octet-stream';
//     if (fileName.endsWith('.json')) {
//       contentType = 'application/json';
//     } else if (fileName.endsWith('.onnx')) {
//       contentType = 'application/octet-stream';
//     }
    
//     // Return the file with appropriate headers
//     return new Response(object.body, {
//       headers: {
//         'Content-Type': contentType,
//         'Content-Length': object.size.toString(),
//         'Access-Control-Allow-Origin': '*',
//         'Cache-Control': 'public, max-age=31536000, immutable',
//       },
//     });
//   } catch (error) {
//     console.error('Error serving model file:', error);
//     return new Response(
//       JSON.stringify({ 
//         error: 'Failed to serve model file', 
//         message: error instanceof Error ? error.message : String(error) 
//       }),
//       {
//         status: 500,
//         headers: {
//           'Content-Type': 'application/json',
//           'Access-Control-Allow-Origin': '*',
//         },
//       }
//     );
//   }
// }



// File: /functions/api/model/[name].js

export async function onRequest(context) {
  const { name } = context.params;
  const fileName = decodeURIComponent(name);
  const R2_PUBLIC_URL = "https://pub-8f63dcf3949541bdb6af062ebd3fe440.r2.dev";

  // Tạo URL trực tiếp tới file trên R2
  const r2Url = `${R2_PUBLIC_URL}/${fileName}`;

  // Trả về lệnh Redirect 302 để trình duyệt tự qua R2 lấy file
  // Việc này giúp tránh giới hạn 25MB của Pages vì Pages không trực tiếp chứa file này
  return Response.redirect(r2Url, 302);
}