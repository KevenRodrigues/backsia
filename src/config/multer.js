import multer from 'multer';
import crypto from 'crypto';
import { extname, resolve } from 'path';

import aws from 'aws-sdk';
import multerSharpS3 from 'multer-sharp-s3';

const storageTypes = {
    local: multer.diskStorage({
        destination: resolve(__dirname, '..', '..', 'tmp', 'uploads'),
        filename: (req, file, cb) => {
            crypto.randomBytes(16, (err, res) => {
                if (err) return cb(err);
                return cb(
                    null,
                    res.toString('hex') + extname(file.originalname)
                );
            });
        },
    }),
    s3: multerSharpS3({
        s3: new aws.S3(),
        Bucket: 'sialab',
        acl: 'public-read',
        key(request, file, cb) {
            cb(null, `${Date.now().toString()} - ${file.originalname}`);
        },
    }),
};

export default {
    storage: storageTypes.s3,
    limits: {
        fileSize: 10 * 1024 * 1024,
        fieldSize: 10 * 1024 * 1024,
        fieldNameSize: 999999999,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/pjpeg',
            'image/png',
            'image/gif',
            '.pdf',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    'Formato de arquivo inválido. Selecione jpeg | pjpeg | png | gif'
                )
            );
        }
    },
};
