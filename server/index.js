import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import multer from 'multer'; // Importamos multer para manejar la subida de archivos
import dicomParser from 'dicom-parser'; // Importamos dicom-parser para verificar si el archivo es DICOM
import { ExtractJwt, Strategy } from 'passport-jwt';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { createUser, findUser, verifyUser } from './database.js';

const SECRET_KEY = 'secret';

const strategyOpts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: SECRET_KEY,
};

passport.use(new Strategy(strategyOpts, async (jwtPayload, done) => {
  try {
    const username = jwtPayload.username;
    const user = await findUser(username);
    if (user) {
      return done(null, user);
    }
    return done("User not found", false);
  } catch (err) {
    return done(err);
  }
}));

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = process.env.PORT ?? 3000;

// Configuramos multer para manejar la subida de archivos
const storage = multer.memoryStorage();
const upload = multer({ storage });

app.get('/', (req, res) => {
  res.send('Hello world');
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).send('Invalid username or password');
    return;
  }
  if (await findUser(username)) {
    res.status(400).send('User already exists');
    return;
  }
  await createUser(username, password);
  const token = jwt.sign({
    username
  }, SECRET_KEY, {
    expiresIn: '1d',
  });
  res.status(201).json({ token });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).send('Invalid username or password');
    return;
  }
  if (!(await findUser(username))) {
    res.status(401).send('Login failed');
    return;
  }
  if (!(await verifyUser(username, password))) {
    res.status(401).send('Login failed');
    return;
  }
  const token = jwt.sign({
    username
  }, SECRET_KEY, {
    expiresIn: '1d',
  });
  res.status(200).json({ token });
});

app.get('/me', passport.authenticate('jwt', { session: false }), (req, res) => {
  res.json(req.user);
});

// Nuevo endpoint para subir imágenes y verificar si es DICOM
app.post('/upload', upload.single('image'), (req, res) => {
  try {
    const fileBuffer = req.file.buffer;
    const dataSet = dicomParser.parseDicom(fileBuffer);

    if (dataSet) {
      res.json({ message: 'El archivo es un DICOM válido' });
    } else {
      res.status(400).json({ message: 'El archivo no es un DICOM válido' });
    }
  } catch (error) {
    res.status(400).json({ message: 'Error al analizar el archivo, puede que no sea DICOM' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});