import Database from '../../database';

class FileController {
    async store(req, res) {
        try {
            const { File } = Database.getModels(req.database);
            const { originalname: name, filename: path } = req.file;

            const file = await File.create({
                name,
                path,
            }).catch(err => {
                return res.status(400).json({ error: err.message });
            });

            return res.status(200).json(file);
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }
    }
}

export default new FileController();
