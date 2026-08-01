import { Request, Response, NextFunction } from 'express';

export function handleEbookUpload(req: Request, res: Response, next: NextFunction) {
  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('multipart/form-data')) {
    return next();
  }

  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    return res.status(400).json({ error: 'Missing boundary in multipart request' });
  }

  const boundary = boundaryMatch[1] || boundaryMatch[2];
  const chunks: Buffer[] = [];

  req.on('data', (chunk) => {
    chunks.push(chunk);
  });

  req.on('end', () => {
    try {
      const buffer = Buffer.concat(chunks);
      const boundaryBuffer = Buffer.from(`--${boundary}`);
      
      const parts: Buffer[] = [];
      let start = 0;

      while (start < buffer.length) {
        const index = buffer.indexOf(boundaryBuffer, start);
        if (index === -1) break;
        if (start > 0) {
          parts.push(buffer.subarray(start, index));
        }
        start = index + boundaryBuffer.length;
      }

      req.body = req.body || {};
      
      for (const part of parts) {
        // Find double CRLF separating headers from body
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd === -1) continue;

        const headerStr = part.subarray(0, headerEnd).toString('utf-8');
        // Part content (excluding trailing \r\n)
        let bodyBuffer = part.subarray(headerEnd + 4);
        if (bodyBuffer.subarray(bodyBuffer.length - 2).toString('utf-8') === '\r\n') {
          bodyBuffer = bodyBuffer.subarray(0, bodyBuffer.length - 2);
        }

        const nameMatch = headerStr.match(/name="([^"]+)"/i);
        const filenameMatch = headerStr.match(/filename="([^"]+)"/i);
        const contentTypeMatch = headerStr.match(/content-type:\s*([^\r\n]+)/i);

        if (nameMatch) {
          const fieldName = nameMatch[1];
          if (filenameMatch) {
            const originalname = filenameMatch[1];
            const mimetype = contentTypeMatch ? contentTypeMatch[1].trim() : 'application/octet-stream';
            (req as any).file = {
              buffer: bodyBuffer,
              originalname,
              mimetype,
              size: bodyBuffer.length,
            };
          } else {
            req.body[fieldName] = bodyBuffer.toString('utf-8').trim();
          }
        }
      }

      next();
    } catch (err) {
      console.error('Multipart upload error:', err);
      res.status(400).json({ error: 'Failed to parse file upload' });
    }
  });

  req.on('error', (err) => {
    next(err);
  });
}
