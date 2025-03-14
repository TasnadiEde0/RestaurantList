window.onload = () => {
  document.getElementById('loginForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;

    const nameRegex = /^[a-zA-Z0-9]+$/;
    if (!nameRegex.test(name)) {
      alert('Name can only contain letters and numbers');
      return;
    }

    const passwordRegex = /^[a-zA-Z0-9]+$/;
    if (!passwordRegex.test(password)) {
      alert('Password can only contain letters and numbers');
      return;
    }

    fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
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
          document.getElementById('loginDiv').innerHTML = JSON.parse(data).error;
        }
      })
      .catch((err) => {
        console.log(err);
        alert('An error has ocurred!');
      });
  });
};
