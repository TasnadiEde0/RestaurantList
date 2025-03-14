import { join } from 'path';
import { unlink, renameSync } from 'fs';
import {
  checkNewPicture,
  checkDeletePicture,
  checkReservationDeletion,
  checkReservationConfirmation,
  getRestaurant,
  checkUser,
  checkRestaurant,
  getPictureCount,
  getReservations,
  getPictures,
} from '../db/db.js';

export function loginCheck(req, res, next) {
  if (req.session.username) {
    next();
  } else {
    res.redirect('/login.html');
  }
}

export function roleCheck(role) {
  return (req, res, next) => {
    if (role === req.session.role) {
      next();
      return;
    }
    res.status(403).send('You do not have permission!');
  };
}

export async function testDeleteReservation(request, response, next) {
  try {
    const boolcase = !(await checkReservationDeletion(request.body.id, request.session.username));
    if (boolcase) {
      response.status(403).end();
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
}

export async function testConfirmReservation(request, response, next) {
  try {
    const boolcase = !(await checkReservationConfirmation(request.body.id, request.session.username));
    if (boolcase) {
      response.status(403).end();
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
}

export async function testNewReservation(request, response, next) {
  try {
    response.set('Content-Type', 'text/html;charset=utf-8');
    const userName = request.session.username;
    const restaurantID = parseInt(request.params.id, 10);
    const { time } = request.body;
    const date = new Date(request.body.date);
    const result = (await getRestaurant(request.params.id))[0];
    const pictures = await getPictures(request.params.id);
    const reservations = await getReservations(request.params.id);
    reservations.forEach((r) => {
      const rs = r.Date.split(' ');
      r.Date = `${rs[2]} ${rs[0]} ${rs[1]}`;
    });
    if (await checkUser(userName)) {
      response.status(404);
      response.render('restaurant', {
        result,
        reservations,
        pictures,
        reservationError: 'Invalid user',
        pictureError: null,
        name: request.session.username,
      });
      return;
    }
    if (await checkRestaurant(restaurantID)) {
      response.status(404);
      response.render('restaurant', {
        result,
        reservations,
        pictures,
        reservationError: 'Invalid restaurant',
        pictureError: null,
        name: request.session.username,
      });
      return;
    }
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) {
      response.status(400);
      response.render('restaurant', {
        result,
        reservations,
        pictures,
        reservationError: 'Enter a valid time',
        pictureError: null,
        name: request.session.username,
      });
      return;
    }
    if (new Date() > date) {
      response.status(400);
      response.render('restaurant', {
        result,
        reservations,
        pictures,
        reservationError: 'Invalid date selected',
        pictureError: null,
        name: request.session.username,
      });
      return;
    }

    const setHour = parseInt(time.split(':')[0], 10);
    const setMin = parseInt(time.split(':')[1], 10);
    const restaurantData = await getRestaurant(restaurantID);
    const OpenHour = parseInt(restaurantData[0].OpenHour, 10);
    const OpenMin = parseInt(restaurantData[0].OpenMin, 10);
    const CloseHour = parseInt(restaurantData[0].CloseHour, 10);
    const CloseMin = parseInt(restaurantData[0].CloseMin, 10);

    if (
      !(
        (OpenHour < setHour && CloseHour > setHour) ||
        (OpenHour === setHour && OpenMin <= setMin) ||
        (CloseHour === setHour && CloseMin >= setMin)
      )
    ) {
      response.status(400);
      response.render('restaurant', {
        result,
        reservations,
        pictures,
        reservationError: 'The provided time is outside the open hours',
        pictureError: null,
        name: request.session.username,
      });
      return;
    }
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
  next();
}

export async function testDeletePicture(request, response, next) {
  try {
    if (await checkDeletePicture(request.session.username, request.body.id)) {
      next();
      return;
    }

    response.status(403).send('You do not have permission to delete this picture!');
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
}

export async function testNewPicture(request, response, next) {
  try {
    response.set('Content-Type', 'text/html;charset=utf-8');

    const ID = parseInt(request.params.id, 10);
    const fileType = request.file.originalname.split('.')[request.file.originalname.split('.').length - 1];
    const fileCount = await getPictureCount(ID);
    const reservations = await getReservations(request.params.id);
    reservations.forEach((r) => {
      const rs = r.Date.split(' ');
      r.Date = `${rs[2]} ${rs[0]} ${rs[1]}`;
    });
    const fileName = join(process.cwd(), `static/picsFolder/${ID}_${fileCount + 1}.${fileType}`);

    if (await checkRestaurant(ID)) {
      unlink(request.file.path, (err) => {
        if (err) {
          console.log(err);
        }
      });

      response.status(404);
      // response.render('manageRestaurant', {
      //   result,
      //   reservations,
      //   pictures,
      //   reservationError: '',
      //   pictureError: 'Invalid ID',
      //   name: request.session.username,
      // });
      return;
    }
    if (request.file.mimetype !== 'image/png' && request.file.mimetype !== 'image/jpeg') {
      unlink(request.file.path, (err) => {
        if (err) {
          console.log(err);
        }
      });
      response.status(400);
      // response.render('manageRestaurant', {
      //   result,
      //   reservations,
      //   pictures,
      //   reservationError: '',
      //   pictureError: 'Invalid file type',
      //   name: request.session.username,
      // });
      return;
    }

    renameSync(request.file.path, fileName, (err) => {
      if (err) {
        console.log(err);
      }
    });

    if (!(await checkNewPicture(request.session.username, request.params.id))) {
      response.status(403).end();
      return;
    }
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
  next();
}

export function testLogin(request, response, next) {
  try {
    const nameRegex = /^[a-zA-Z0-9]+$/;
    if (!nameRegex.test(request.body.name)) {
      response.status(400).send(JSON.stringify({ error: 'Name can only contain letters and numbers' }));
      return;
    }

    const passwordRegex = /^[a-zA-Z0-9]+$/;
    if (!passwordRegex.test(request.body.password)) {
      response.status(400).send(JSON.stringify({ error: 'Password can only contain letters and numbers' }));
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
}

export function testRegister(request, response, next) {
  try {
    const { name } = request.body;
    const { password } = request.body;

    const nameRegex = /^[a-zA-Z0-9]+$/;
    if (!nameRegex.test(name)) {
      response.status(400).send(JSON.stringify({ error: 'Name can only contain letters and numbers' }));
      return;
    }

    const passwordRegex = /^[a-zA-Z0-9]+$/;
    if (!passwordRegex.test(password)) {
      response.status(400).send(JSON.stringify({ error: 'Password can only contain letters and numbers' }));
      return;
    }

    next();
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
}

export function testRegisterOwner(request, response, next) {
  try {
    if (request.body.ownerCheck) {
      const { rName } = request.body;
      const { open } = request.body;
      const { close } = request.body;
      const { city } = request.body;
      const { street } = request.body;
      const { strNumber } = request.body;
      const { number } = request.body;
      const openHour = parseInt(open.split(':')[0], 10);
      const openMin = parseInt(open.split(':')[1], 10);
      const closeHour = parseInt(close.split(':')[0], 10);
      const closeMin = parseInt(close.split(':')[1], 10);

      const rNameRegex = /^[a-zA-Z ]+$/;
      if (!rNameRegex.test(rName)) {
        response.status(400).send(JSON.stringify({ error: 'Invalid name' }));
        return;
      }

      const numberRegex = /^[0-9]{10}$/;
      if (!numberRegex.test(number)) {
        response.status(400).send(JSON.stringify({ error: 'Enter a valid phone nuber' }));
        return;
      }

      const addressRegex = /^[a-zA-Z0-9 .]+$/;
      if (!addressRegex.test(city)) {
        response.status(400).send(JSON.stringify({ error: 'City name can only contain letters, numbers and spaces' }));
        return;
      }

      if (!addressRegex.test(street)) {
        response
          .status(400)
          .send(JSON.stringify({ error: 'Street name can only contain letters, numbers and spaces' }));
        return;
      }

      if (!addressRegex.test(strNumber)) {
        response
          .status(400)
          .send(JSON.stringify({ error: 'Street number can only contain letters, numbers and spaces' }));
        return;
      }

      if (!(openHour < closeHour || (openHour === closeHour && openMin < closeMin))) {
        response.status(400).send(JSON.stringify({ error: 'Enter a valid open period' }));
        return;
      }
    }
    next();
  } catch (err) {
    console.log(err);
    response.status(500).end();
  }
}
