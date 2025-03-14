import sql from 'mssql';

const pool = await sql.connect({
  user: 'webprogUser',
  password: '1234',
  server: 'LAPTOP-CSOVMA64',
  database: 'webprog',
  options: {
    trustServerCertificate: true,
  },
});

// await sql.query(`
//   DROP TABLE Pictures
//   DROP TABLE Reservations
//   DROP TABLE Users
//   DROP TABLE Restaurants
// `)
// INSERT INTO Users(Name, PasswordHash, IsOwner) VALUES
// ('user1', '$2b$04$szFrkwEJj7Ok3qgen0bBA.JlAub/ZarbxSn5Kovoh7smqweotsWje', 1),
// ('user2', '$2b$04$szFrkwEJj7Ok3qgen0bBA.JlAub/ZarbxSn5Kovoh7smqweotsWje', 0),
// ('user3', '$2b$04$szFrkwEJj7Ok3qgen0bBA.JlAub/ZarbxSn5Kovoh7smqweotsWje', 0),
// ('user4', '$2b$04$szFrkwEJj7Ok3qgen0bBA.JlAub/ZarbxSn5Kovoh7smqweotsWje', 0),
// ('user5', '$2b$04$szFrkwEJj7Ok3qgen0bBA.JlAub/ZarbxSn5Kovoh7smqweotsWje', 1)
// INSERT INTO Restaurants(Name, City, Street, StrNumber, Number, OpenHour, OpenMin, CloseHour, CloseMin, OwnerID) VALUES
// ('McDonalds', 'NY', 'NY01', '01','0712345678', '11', '11', '23', '23', 1),
// ('BKing', 'NY', 'NY01', '01','0712345678', '11', '11', '23', '23', 5)

await sql.query(
  `
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
  BEGIN
    CREATE TABLE Users (
      UserID INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
      Name VARCHAR(255), 
      PasswordHash VARCHAR(255),
      IsOwner BIT
    );
  END
  IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Restaurants' and xtype='U')
  BEGIN
      CREATE TABLE Restaurants (
        RestaurantID INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
        Name VARCHAR(255),
        City VARCHAR(255),
        Street VARCHAR(255),
        StrNumber VARCHAR(255),
        Number VARCHAR(255),
        OpenHour VARCHAR(2), 
        OpenMin VARCHAR(2), 
        CloseHour VARCHAR(2), 
        CloseMin VARCHAR(2),
        OwnerID INT FOREIGN KEY REFERENCES Users(UserID)
      );
  END
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Reservations' and xtype='U')
      CREATE TABLE Reservations (
        ReservationID INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
        Date VARCHAR(255),
        Hour VARCHAR(2),
        Min VARCHAR(2),
        Confirmed BIT,
        UserID INT FOREIGN KEY REFERENCES Users(UserID),
        RestaurantID INT FOREIGN KEY REFERENCES Restaurants(RestaurantID)
      );
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Pictures' and xtype='U')
      CREATE TABLE Pictures (
        PictureID INT NOT NULL IDENTITY(1, 1) PRIMARY KEY,
        Name VARCHAR(255),
        RestaurantID INT FOREIGN KEY REFERENCES Restaurants(RestaurantID)
      );
      `,
);

export async function getRestaurants() {
  const data = await pool.query('SELECT * FROM Restaurants');
  return 'recordset' in data ? data.recordset : [];
}

export async function getRestaurant(id) {
  const data = await pool.request().input('id', id).query('SELECT * FROM Restaurants WHERE RestaurantID = @id');
  return 'recordset' in data ? data.recordset : [];
}

export async function getUsers() {
  const data = await pool.query('SELECT * FROM Users');
  return 'recordset' in data ? data.recordset : [];
}

export async function checkUser(name) {
  const data = (
    await pool.request().input('name', name).query('SELECT COUNT(UserID) AS Count FROM Users WHERE Name = @name')
  ).recordset[0].Count;
  return parseInt(data, 10) === 0;
}

export async function checkRestaurant(ID) {
  const data = (
    await pool
      .request()
      .input('id', ID)
      .query('SELECT COUNT(RestaurantID) AS Count FROM Restaurants WHERE RestaurantID = @id')
  ).recordset[0].Count;
  return parseInt(data, 10) === 0;
}

export async function addReservation(name, restaurantID, date, hour, min) {
  await pool
    .request()
    .input('name', name)
    .input('restaurantID', restaurantID)
    .input('date', date)
    .input('hour', hour)
    .input('min', min)
    .query(
      'INSERT INTO Reservations(Date, Hour, Min, Confirmed, UserID, RestaurantID) VALUES (@date, @hour, @min, 0, (SELECT TOP 1 UserID FROM Users WHERE Name = @name), @restaurantID)',
    );
}
export async function getPictureCount(ID) {
  const data = (
    await pool
      .request()
      .input('id', ID)
      .query('SELECT COUNT(PictureID) AS Count FROM Pictures WHERE RestaurantID = @id')
  ).recordset[0].Count;
  return data;
}

export async function addPicture(filename, restaurantID) {
  await pool
    .request()
    .input('restaurantID', restaurantID)
    .input('name', filename)
    .query('INSERT INTO Pictures(Name, RestaurantID) VALUES (@name, @restaurantID)');
  const data = await pool
    .request()
    .input('restaurantID', restaurantID)
    .input('name', filename)
    .query('SELECT PictureID FROM Pictures WHERE Name = @name AND RestaurantID = @restaurantID');
  return data.recordset[0].PictureID;
}

export async function getPictures(ID) {
  const data = await pool.request().input('id', ID).query('SELECT * FROM Pictures WHERE RestaurantID = @id');
  return 'recordset' in data ? data.recordset : [];
}

export async function deleteReservation(ID) {
  await pool.request().input('id', ID).query('DELETE FROM Reservations WHERE ReservationID = @id');
}

export async function deletePicture(ID) {
  await pool.request().input('id', ID).query('DELETE FROM Pictures WHERE PictureID = @id');
}

export async function checkLoginData(name) {
  const data = await pool.request().input('name', name).query('SELECT PasswordHash FROM Users WHERE Name = @name');
  if (data.rowsAffected[0] === 0) {
    return null;
  }
  return data.recordset[0].PasswordHash;
}

export async function checkReservationDeletion(id, name) {
  let data = await pool.request().input('id', id).input('name', name).query(`SELECT * FROM Reservations V
      JOIN Restaurants T ON V.RestaurantID = T.RestaurantID 
      JOIN Users U ON U.UserID = T.OwnerID
      WHERE U.Name = @name AND V.ReservationID = @id`);

  if (data.rowsAffected[0] === 0) {
    data = await pool.request().input('id', id).input('name', name).query(`SELECT * FROM Reservations R 
        JOIN Users U ON U.UserID = R.UserID
        WHERE U.Name = @name AND R.ReservationID = @id`);

    if (data.rowsAffected[0] === 0) {
      return false;
    }
  }

  return true;
}

export async function checkReservationConfirmation(id, name) {
  const data = await pool.request().input('id', id).input('name', name).query(`SELECT * FROM Reservations V
      JOIN Restaurants T ON V.RestaurantID = T.RestaurantID 
      JOIN Users U ON U.UserID = T.OwnerID
      WHERE U.Name = @name AND V.ReservationID = @id`);

  if (data.rowsAffected[0] === 0) {
    return false;
  }

  return true;
}

export async function addNewUser(name, hash, isOwner) {
  const data = await pool
    .request()
    .input('name', name)
    .input('hash', hash)
    .query('SELECT COUNT(*) AS Count FROM Users WHERE Name = @name');
  if (data.recordset[0].Count !== 0) {
    return 1;
  }
  pool
    .request()
    .input('name', name)
    .input('hash', hash)
    .input('isOwner', isOwner)
    .query('INSERT INTO USERS(Name, PasswordHash, IsOwner) VALUES (@name, @hash, @isOwner)');
  return 0;
}

export async function addRestaurant(restaurant) {
  await pool
    .request()
    .input('name', restaurant.name)
    .input('city', restaurant.address.city)
    .input('street', restaurant.address.street)
    .input('strNumber', restaurant.address.strNumber)
    .input('number', restaurant.number)
    .input('openHour', restaurant.hours.openHour)
    .input('openMin', restaurant.hours.openMin)
    .input('closeHour', restaurant.hours.closeHour)
    .input('closeMin', restaurant.hours.closeMin)
    .input('rName', restaurant.rName)
    .query(
      `INSERT INTO Restaurants(Name, City, Street, StrNumber, Number, OpenHour, OpenMin, CloseHour, CloseMin, OwnerID) 
    VALUES (@rName, @city, @street, @strNumber, @number, @openHour, @openMin, @closeHour, @closeMin, (SELECT TOP 1 UserID FROM Users WHERE Name = @name)) `,
    );
}

export async function getOtherRestaurants(name) {
  const data = await pool.request().input('name', name)
    .query(`SELECT R.RestaurantID, R.Name, R.City, R.Street, R.StrNumber, R.Number, R.OpenHour, R.OpenMin, R.CloseHour, R.CloseMin 
    FROM Restaurants R JOIN Users U ON U.UserID = R.OwnerID WHERE U.Name != @name`);
  return 'recordset' in data ? data.recordset : [];
}

export async function getOwnRestaurant(name) {
  const data = await pool.request().input('name', name)
    .query(`SELECT R.RestaurantID, R.Name, R.City, R.Street, R.StrNumber, R.Number, R.OpenHour, R.OpenMin, R.CloseHour, R.CloseMin 
    FROM Restaurants R JOIN Users U On U.UserID = R.OwnerID WHERE U.Name = @name`);
  return 'recordset' in data ? data.recordset[0] : null;
}

export async function getRole(name) {
  const data = await pool.request().input('name', name).query('SELECT IsOwner FROM Users WHERE Name = @name');
  return data.recordset[0].IsOwner ? 'owner' : 'user';
}

export async function getReservations(ID, name) {
  if (name) {
    const data = await pool
      .request()
      .input('id', ID)
      .input('name', name)
      .query(
        'SELECT * FROM Reservations R JOIN Users U ON R.UserID = U.UserID WHERE R.RestaurantID = @id AND U.Name = @name',
      );
    return 'recordset' in data ? data.recordset : [];
  }

  const data = await pool
    .request()
    .input('id', ID)
    .query('SELECT * FROM Reservations R JOIN Users U ON R.UserID = U.UserID WHERE R.RestaurantID = @id');
  return 'recordset' in data ? data.recordset : [];
}

export async function confirmReservation(ID) {
  await pool.request().input('id', ID).query('UPDATE Reservations SET Confirmed = 1 WHERE ReservationID= @id');
}

export async function checkDeletePicture(name, id) {
  const data = await pool.request().input('name', name).input('id', id).query(`
    SELECT * FROM Restaurants R
    JOIN Users U ON U.UserID = R.OwnerID
    JOIN Pictures P ON P.RestaurantID = R.RestaurantID
    WHERE U.Name = @name AND P.PictureID = @id
    `);

  return data.rowsAffected[0] !== 0;
}

export async function checkNewPicture(name, id) {
  const data = await pool.request().input('name', name).input('id', id).query(`
    SELECT * FROM Restaurants R
    JOIN Users U ON U.UserID = R.OwnerID
    WHERE U.Name = @name AND R.RestaurantID = @id
    `);

  return data.rowsAffected[0] !== 0;
}
