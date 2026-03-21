import { S3Client } from '@aws-sdk/client-s3'

const spaces = new S3Client({
    endpoint: `https://${process.env.DO_SPACES_REGION}.digitaloceanspaces.com`,
    region: process.env.DO_SPACES_REGION,
    credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
    },
})

export const BUCKET = process.env.DO_SPACES_BUCKET
export const CDN_URL = `https://${BUCKET}.${process.env.DO_SPACES_REGION}.cdn.digitaloceanspaces.com`

export default spaces
