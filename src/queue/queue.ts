import express from 'express';
import { queue } from '../index';

const app = express();
app.use(express.json());

app.post('/signup', async (req, res) => {
    const { email } = req.body;

    const job = await queue.add('send_email', { email });

    res.send({
        message: 'Job added to queue',
        jobId: job.id,
    })
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`listening on ${port}`));

export default app;