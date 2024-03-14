const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

function getCirculatingPrice() {
  return Math.random() * 100000000;
}

app.get('/api/scar/csupply', (req, res) => {
  const price = getCirculatingPrice(); 
  const formattedPrice = price.toFixed(8);
  res.send(formattedPrice);
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
