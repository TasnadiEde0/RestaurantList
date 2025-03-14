import express from 'express';
import bcrypt from 'bcrypt';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import multer from 'multer';
import {
  loginCheck,
  roleCheck,
  testNewPicture,
  testNewReservation,
  testLogin,
  testRegister,
  testDeletePicture,
  testConfirmReservation,
  testDeleteReservation,
  testRegisterOwner,
} from '../middleware/errorHandling.js';
import {
  deletePicture,
  getRestaurants,
  addReservation,
  getRestaurant,
  getReservations,
  confirmReservation,
  deleteReservation,
  getPictures,
  checkLoginData,
  addNewUser,
  addRestaurant,
  getRole,
  getOwnRestaurant,
  getOtherRestaurants,
  getPictureCount,
  addPicture,
} from '../db/db.js';

const router = express.Router();

const picsFolder = join(process.cwd(), 'static/picsFolder');
if (!existsSync(picsFolder)) {
  mkdirSync(picsFolder);
}

const multerUpload = multer({
  dest: picsFolder,
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (!existsSync(picsFolder)) {
        mkdirSync(picsFolder);
      }
      cb(null, picsFolder);
    },
  }),
});

router.get('/', express.urlencoded({ extended: true }), async (request, response) => {
  try {
    if (request.session.role === 'owner') {
      const own = await getOwnRestaurant(request.session.username);
      const result = await getOtherRestaurants(request.session.username);
      response.render('index', { result, name: request.session.username, owner: true, own });
    } else {
      const result = await getRestaurants();
      response.render('index', { result, name: request.session.username, owner: false });
    }
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

router.post('/login', express.json(), testLogin, async (request, response) => {
  try {
    const hash = await checkLoginData(request.body.name);

    if (hash && (await bcrypt.compare(request.body.password, hash))) {
      request.session.username = request.body.name;
      request.session.role = await getRole(request.body.name);
      response.redirect('/');
      return;
    }

    response.status(401).send(JSON.stringify({ error: 'Incorrect name or password!' }));
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

router.post('/register', express.json(), testRegister, testRegisterOwner, async (request, response) => {
  try {
    const { name } = request.body;
    const { password } = request.body;

    const isOwner = request.body.ownerCheck ? Number(1) : Number(0);

    if ((await addNewUser(name, await bcrypt.hash(password, 10), isOwner)) === 1) {
      response.status(401).send(JSON.stringify({ error: 'User already registered!' }));
      return;
    }

    request.session.username = name;
    request.session.role = request.body.ownerCheck ? 'owner' : 'user';

    if (request.body.ownerCheck) {
      const { rName } = request.body;
      const { open } = request.body;
      const { close } = request.body;
      const { city } = request.body;
      const { street } = request.body;
      const { strNumber } = request.body;
      const { number } = request.body;
      console.log(open.split(':'), close.split(':'));
      const openHour = open.split(':')[0];
      const openMin = open.split(':')[1];
      const closeHour = close.split(':')[0];
      const closeMin = close.split(':')[1];

      const restaurant = {
        name: request.session.username,
        rName,
        address: { city, street, strNumber },
        number,
        hours: { openHour, openMin, closeHour, closeMin },
      };

      console.log(restaurant);

      await addRestaurant(restaurant);
    }

    response.redirect('/');
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

router.post('/logout', (request, response) => {
  request.session.destroy((err) => {
    if (err) {
      request.status(500).send(`Session reset error: ${err.message}`);
    } else {
      response.redirect('/');
    }
  });
});

router.get('/restaurant/:id', express.urlencoded({ extended: true }), async (request, response) => {
  try {
    const result = (await getRestaurant(request.params.id))[0];
    const reservations = await getReservations(request.params.id, request.session.username);
    reservations.forEach((r) => {
      const rs = r.Date.split(' ');
      r.Date = `${rs[2]} ${rs[0]} ${rs[1]}`;
    });
    const pictures = await getPictures(request.params.id);

    response.render('restaurant', {
      result,
      reservations,
      pictures,
      reservationError: '',
      pictureError: '',
      name: request.session.username,
    });
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

router.get('/moreInformation/:id', async (request, response) => {
  try {
    const [rest] = await getRestaurant(request.params.id);

    const msg = {
      OpenHour: rest.OpenHour,
      OpenMin: rest.OpenMin,
      CloseHour: rest.CloseHour,
      CloseMin: rest.CloseMin,
      City: rest.City,
      Street: rest.Street,
      StrNumber: rest.StrNumber,
      Number: rest.Number,
    };

    response.end(JSON.stringify(msg));
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

router.get('/manageRestaurant', loginCheck, roleCheck('owner'), async (request, response) => {
  try {
    const own = await getOwnRestaurant(request.session.username);
    const reservations = await getReservations(own.RestaurantID);
    reservations.forEach((r) => {
      const rs = r.Date.split(' ');
      r.Date = `${rs[2]} ${rs[0]} ${rs[1]}`;
    });
    const pictures = await getPictures(own.RestaurantID);

    response.render('manageRestaurant', {
      result: own,
      reservations,
      pictures,
      reservationError: '',
      pictureError: '',
      name: request.session.username,
    });
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

router.post(
  '/submitNewPicture/:id',
  express.urlencoded({ extended: true }),
  loginCheck,
  multerUpload.single('file'),
  testNewPicture,
  async (request, response) => {
    try {
      console.log(request.file);
      const restaurantID = parseInt(request.params.id, 10);
      const ID = parseInt(request.params.id, 10);
      const fileType = request.file.originalname.split('.')[request.file.originalname.split('.').length - 1];
      const fileCount = await getPictureCount(ID);
      const fileName = join(process.cwd(), `static/picsFolder/${ID}_${fileCount + 1}.${fileType}`);
      const finalName = `picsFolder/${fileName.split('\\')[fileName.split('\\').length - 1]}`;

      const PictureID = await addPicture(finalName, restaurantID);

      response.send(JSON.stringify({ name: finalName, PictureID }));

      console.log(`New restaurant picture submitted as ${finalName} `);
    } catch (err) {
      console.log(err);
      response.status(500).end();
    }
  },
);

router.delete('/deletePicture', express.json(), loginCheck, testDeletePicture, async (request, response) => {
  try {
    await deletePicture(request.body.id);

    response.status(200).end();
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

router.post(
  '/submitNewReservation/:id',
  express.urlencoded({ extended: true }),
  loginCheck,
  testNewReservation,
  async (request, response) => {
    try {
      const userName = request.session.username;
      const restaurantID = parseInt(request.params.id, 10);
      const { time } = request.body;
      const hour = time.split(':')[0];
      const min = time.split(':')[1];
      const date = new Date(request.body.date);

      await addReservation(userName, restaurantID, date, hour, min);

      const result = (await getRestaurant(request.params.id))[0];
      const pictures = await getPictures(request.params.id);
      const reservations = await getReservations(request.params.id, request.session.username);
      reservations.forEach((r) => {
        const rs = r.Date.split(' ');
        r.Date = `${rs[2]} ${rs[0]} ${rs[1]}`;
      });

      response.render('restaurant', {
        result,
        reservations,
        pictures,
        reservationError: 'Reservation made successfully',
        pictureError: '',
        name: request.session.username,
      });

      console.log(`New reservation made for ${userName} to the restaurant with the ID of ${restaurantID} at ${time}`);
      console.log({ userName, restaurantID, time, date });
    } catch (err) {
      console.log(err);
      response.status(500).end();
    }
  },
);

router.delete('/deleteReservation', express.json(), loginCheck, testDeleteReservation, async (request, response) => {
  try {
    await deleteReservation(request.body.id);

    response.status(200).end();
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

router.post('/confirmReservation', express.json(), loginCheck, testConfirmReservation, async (request, response) => {
  try {
    await confirmReservation(request.body.id);

    response.status(200).end();
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
});

export default router;
