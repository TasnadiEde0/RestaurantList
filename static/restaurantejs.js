window.onload = () => {
  if (document.getElementById('newReservationForm')) {
    document.getElementById('newReservationForm').addEventListener('submit', (event) => {
      event.preventDefault();

      const time = document.getElementById('time').value;
      const date = document.getElementById('date').value;

      const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        alert('Invalid time selected');
        return;
      }

      if (new Date() > date) {
        alert('Invalid date selected');
        return;
      }

      document.getElementById('newReservationForm').submit();
    });
  }

  if (document.getElementsByName('deleteReservation')) {
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
};
