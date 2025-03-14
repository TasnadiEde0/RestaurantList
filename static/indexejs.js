window.onload = () => {
  document.getElementsByName('restaurantDIV').forEach((element) => {
    element.addEventListener('click', (event) => {
      let ID;
      if (event.target.id[0] === 'h') {
        ID = event.target.id.slice(1, event.target.id.length);
      } else {
        ID = event.target.id;
      }

      fetch(`/moreInformation/${ID}`, {
        method: 'get',
      })
        .then((response) => response.text())
        .then((responseText) => {
          responseText = JSON.parse(responseText);

          const msg = `Schedule: ${responseText.OpenHour}:${responseText.OpenMin} - ${responseText.CloseHour}:${responseText.CloseMin}<br>
          Location: ${responseText.City}, ${responseText.Street}, ${responseText.StrNumber}<br>
          Phone number: ${responseText.Number}<br>`;

          document.getElementById(ID).innerHTML = msg;
        })
        .catch((err) => {
          console.log(err);
          alert('An error occurred!');
        });
    });
  });
};
