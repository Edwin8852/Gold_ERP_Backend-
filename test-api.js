const axios = require('axios');
axios.get('http://localhost:5000/api/gold-rate/latest')
  .then(res => console.log('SUCCESS:', res.data))
  .catch(err => {
    console.log('ERROR STATUS:', err.response?.status);
    console.log('ERROR DATA:', err.response?.data);
  });
