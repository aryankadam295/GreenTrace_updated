import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

async function testS3() {
  try {
    console.log('Testing S3 upload to bucket:', process.env.AWS_S3_BUCKET_NAME);
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: 'test-upload.txt',
      Body: 'Hello world',
    });
    
    await s3.send(command);
    console.log('✅ S3 Upload successful!');
  } catch (error) {
    console.error('❌ S3 Upload Error:', error.message);
    if (error.$metadata) console.error('Details:', error.$metadata);
  }
}

testS3();
