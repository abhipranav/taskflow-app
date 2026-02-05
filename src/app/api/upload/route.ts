import { writeFile, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const file: File | null = data.get('file') as unknown as File;

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Save to public/uploads
  const uploadDir = path.join(process.cwd(), 'public/uploads');
  
  try {
    await mkdir(uploadDir, { recursive: true });
    
    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    // Sanitize filename: remove spaces and special chars, keep extension
    const extension = path.extname(file.name);
    const originalName = path.basename(file.name, extension);
    const sanitizedBase = originalName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${sanitizedBase}-${uniqueSuffix}${extension}`;
    
    const filepath = path.join(uploadDir, filename);
    
    await writeFile(filepath, buffer);
    
    // Return relative URL
    const url = `/uploads/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      url, 
      name: file.name, 
      type: file.type, 
      size: file.size 
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ success: false, message: 'Upload failed' }, { status: 500 });
  }
}
