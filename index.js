const Web3 = require("web3");
const express = require('express');

const {treasuryAddress, scarAddress, scarABI} = require('./config/config');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST_DOMAIN = 'yourdomain.com';

//const provider = new Web3.providers.WebsocketProvider(`wss://bsc-rpc.publicnode.com`)
const provider = new Web3.providers.HttpProvider('https://bsc-dataseed1.binance.org/')
const web3 = new Web3(provider);
const scarContract = new web3.eth.Contract(scarABI, scarAddress);

async function getCirculatingSupply() {

    const totalSupply = await getTotalSupply()

    const treasuryBalance = await scarContract.methods.balanceOf(treasuryAddress).call()
    .then(async function(balance){
        const treasuryToWei = web3.utils.fromWei(balance , 'ether')
        return treasuryToWei
    } )
    .catch(error => {
        console.error(error)
    });
    console.log("treasury balance: ", treasuryBalance)

    const circulating = totalSupply - treasuryBalance
    console.log("circulating supply: ", circulating)
    return circulating;

}

async function getTotalSupply() {
    const totalSupply = await scarContract.methods.totalSupply().call()
    .then(async function(balance){
        const totalToWei = web3.utils.fromWei(balance , 'ether')
        return totalToWei
    } )
    .catch(error => {
        console.error(error)
    });
    console.log("total supply: ", totalSupply)
    return totalSupply
}

app.get('/api/scar/circulating', async (req, res) => {
    const circulatingSupply = await getCirculatingSupply();
    const formattedCirculatingSupply = circulatingSupply.toString()
    res.send(formattedCirculatingSupply);
});

app.get('/api/scar/total', async (req, res) => {
    const totalSupply = await getTotalSupply(); 
    const formattedTotalSupply = totalSupply.toString();
    res.send(formattedTotalSupply);
  });


app.listen(PORT, () => {
    console.log(`Server is running on http://${HOST_DOMAIN}:${PORT}`);
});
