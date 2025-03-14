function userChecker() {
  const name = document.getElementById('name').value;
  const password = document.getElementById('password').value;
  const password2 = document.getElementById('password2').value;

  const nameRegex = /^[a-zA-Z0-9]+$/;
  if (!nameRegex.test(name)) {
    alert('Name can only contain letters and numbers');
    return false;
  }

  if (password !== password2) {
    alert('Passwords differ');
    return false;
  }

  const passwordRegex = /^[a-zA-Z0-9]+$/;
  if (!passwordRegex.test(password)) {
    alert('Password can only contain letters and numbers');
    return false;
  }

  return true;
}

function ownerChecker() {
  const rName = document.getElementById('rName').value;
  const city = document.getElementById('city').value;
  const street = document.getElementById('street').value;
  const strNumber = document.getElementById('strNumber').value;
  const number = document.getElementById('number').value;
  const open = document.getElementById('open').value;
  const close = document.getElementById('close').value;

  const restNameRegex = /^[a-zA-Z ]+$/;
  if (!restNameRegex.test(rName)) {
    alert('Invalid name');
    return false;
  }

  const numberRegex = /^[0-9]{10}$/;
  if (!numberRegex.test(number)) {
    alert('Enter a valid phone nuber');
    return false;
  }

  const addressRegex = /^[a-zA-Z0-9 .]+$/;
  if (!addressRegex.test(city)) {
    alert('City name can only contain letters, numbers and spaces');
    return false;
  }

  if (!addressRegex.test(street)) {
    alert('Street name can only contain letters, numbers and spaces');
    return false;
  }

  if (!addressRegex.test(strNumber)) {
    alert('Street number can only contain letters, numbers and spaces');
    return false;
  }

  const openHour = parseInt(open.split(':')[0], 10);
  const openMin = parseInt(open.split(':')[1], 10);
  const closeHour = parseInt(close.split(':')[0], 10);
  const closeMin = parseInt(close.split(':')[1], 10);

  if (!(openHour < closeHour || (openHour === closeHour && openMin < closeMin))) {
    alert('Enter a valid open period');
    return false;
  }

  return true;
}

function setRegister() {
  document.getElementById('registerForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    const fetchData = {};

    // User check

    if (!userChecker()) {
      return;
    }

    fetchData.name = name;
    fetchData.password = password;
    fetchData.ownerCheck = document.getElementById('ownerCheck').checked;

    // Restaurant check

    if (document.getElementById('ownerCheck').checked) {
      if (!ownerChecker()) {
        return;
      }

      const rName = document.getElementById('rName').value;
      const city = document.getElementById('city').value;
      const street = document.getElementById('street').value;
      const strNumber = document.getElementById('strNumber').value;
      const number = document.getElementById('number').value;
      const open = document.getElementById('open').value;
      const close = document.getElementById('close').value;

      fetchData.rName = rName;
      fetchData.city = city;
      fetchData.street = street;
      fetchData.strNumber = strNumber;
      fetchData.number = number;
      fetchData.open = open;
      fetchData.close = close;
    }

    fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fetchData),
    })
      .then((response) => {
        if (response.ok) {
          window.location.href = '/';
          return null;
        }
        if (response.status === 400 || response.status === 401) {
          return response.text();
        }
        alert('Server error!');
        return null;
      })
      .then((data) => {
        if (data) {
          document.getElementById('registerDiv').innerHTML = JSON.parse(data).error;
        }
      })
      .catch((err) => {
        console.log(err);
        alert('An error has ocurred!');
      });
  });
}

function setOwnerCheck() {
  document.getElementById('ownerCheck').addEventListener('change', () => {
    if (document.getElementById('ownerCheck').checked) {
      document.getElementById('ownerDiv').classList.remove('hidden');
    } else {
      document.getElementById('ownerDiv').classList.add('hidden');
    }
  });
}

window.onload = () => {
  setRegister();

  setOwnerCheck();
};
