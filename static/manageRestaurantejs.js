function setDeleteReservation() {
  document.getElementsByName('deleteReservation').forEach((div) => {
    div.addEventListener('click', (event) => {
      const ID = event.target.id;

      const data = {
        id: ID,
      };

      fetch('/deleteReservation', {
        method: 'delete',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((response) => response.status)
        .then((status) => {
          if (status === 200) {
            document.getElementById(`d${ID}`).remove();
          } else if (status === 401) {
            alert('You are unauthorized to delete the given reservation!');
          } else {
            alert('Deletion failed!');
          }
        })
        .catch((err) => {
          console.log(err);
          alert('Deletion failed!');
        });
    });
  });
}

function setConfirmReservation() {
  document.getElementsByName('confirmReservation').forEach((div) => {
    div.addEventListener('click', (event) => {
      const ID = event.target.id.split('_')[1];

      const data = {
        id: ID,
      };

      fetch('/confirmReservation', {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
        .then((response) => response.status)
        .then((status) => {
          if (status === 200) {
            document.getElementById(`confirm_${ID}`).remove();
            document.getElementById(`c_${ID}`).innerText = 'Confirmed';
          } else if (status === 401) {
            alert('You are unauthorized to confirm the given reservation!');
          } else {
            alert('Confirmation failed!');
          }
        })
        .catch((err) => {
          console.log(err);
          alert('Confirmation failed!');
        });
    });
  });
}

function setDeletePicture() {
  const picDelFunc = (event) => {
    const ID = event.target.id.split('_')[1];

    const data = {
      id: ID,
    };

    fetch('/deletePicture', {
      method: 'delete',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then((response) => response.status)
      .then((status) => {
        if (status === 200) {
          document.getElementById(`pd_${ID}`).remove();
        } else if (status === 401) {
          alert('You are unauthorized to delete the given reservation!');
        } else {
          alert('Deletion failed!');
        }
      })
      .catch((err) => {
        console.log(err);
        alert('Deletion failed!');
      });
  };

  document.getElementsByName('deletePicture').forEach((div) => {
    div.addEventListener('click', picDelFunc);
  });

  return picDelFunc;
}

function setNewPicture(picDelFunc) {
  document.getElementById('newPictureForm').addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData();
    data.append('file', document.getElementById('pic').files[0]);

    fetch(document.getElementById('newPictureForm').action, {
      method: 'post',
      body: data,
    })
      .then((response) => response.json().then((body) => ({ status: response.status, body })))
      .then((response) => {
        if (response.status === 200) {
          document.getElementById('pic').value = '';
          const img = document.createElement('img');
          const button = document.createElement('button');
          button.setAttribute('name', 'deletePicture');
          button.setAttribute('id', `p_${response.body.PictureID}`);
          button.textContent = 'Delete';
          img.setAttribute('src', response.body.name);
          const imgDiv = document.createElement('div');
          imgDiv.appendChild(img);
          imgDiv.appendChild(document.createElement('br'));
          imgDiv.appendChild(button);
          imgDiv.setAttribute('id', `pd_${response.body.PictureID}`);
          imgDiv.addEventListener('click', picDelFunc);
          document.getElementById('picDiv').appendChild(imgDiv);

          if (document.getElementById('noPics') && !document.getElementById('noPics').classList.contains('hidden')) {
            document.getElementById('noPics').classList.add('hidden');
          }
        } else if (response.status === 404) {
          alert('Incorrect ID!');
        } else if (response.status === 400) {
          alert('Incorrect file type!');
        }
      })
      .catch((err) => {
        console.log(err);
        alert('Upload failed!');
      });
  });
}

window.onload = () => {
  setDeleteReservation();

  setConfirmReservation();

  const picDelFunc = setDeletePicture();

  setNewPicture(picDelFunc);
};
