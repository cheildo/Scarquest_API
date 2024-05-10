const Web3 = require("web3");
const redis = require('redis');
const express = require('express');
const bodyParser = require('body-parser');

const logger = require('./utils/logger');

const {treasuryAddress, scarAddress, scarABI} = require('./config/config');
const {usdtAddress, routerAddress, routerABI} = require('./config/config');;

const app = express();
const PORT = process.env.PORT || 3000;
const HOST_DOMAIN = 'yourdomain.com';

const client = redis.createClient({
    password: 'pubxorrOatPXj6oN0eXunJIVqGKqzggD',
    socket: {
        host: 'redis-12544.c54.ap-northeast-1-2.ec2.cloud.redislabs.com',
        port: 12544,
    }
});
client.connect();
client.on('error', err => console.log('Redis Client Error', err));
client.on("connect", () => {
    console.log("Connected to redis database!");
    //logger.debug("Connected to redis database!");
});

//const provider = new Web3.providers.WebsocketProvider(`wss://bsc-rpc.publicnode.com`)
const provider = new Web3.providers.HttpProvider('https://bsc-dataseed1.binance.org/')
const web3 = new Web3(provider);
const scarContract = new web3.eth.Contract(scarABI, scarAddress);
const routerContract = new web3.eth.Contract(routerABI, routerAddress);

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

async function getScarFromUSDT(usdAmount) {
    try {
        console.log("Input usdAmount: ", usdAmount)
        const path = [usdtAddress, scarAddress];
        const amountIn = web3.utils.toWei(usdAmount, 'ether');

        const amounts = await routerContract.methods.getAmountsOut(amountIn, path).call();
        const amountOfScarWei = amounts[1]; // Amount of SCAR token in smallest units
        console.log("Output amountOfScarWei: ", amountOfScarWei)
        const amountOfScar = web3.utils.fromWei(amountOfScarWei, 'ether')
        console.log("Output scar amount: ", amountOfScar)
        return amountOfScar;
    } catch (error) {
        console.error('getScarFromUSDT Error:', error);
        return error
    }
}

async function swapUSDTtoScar(usdAmount, toAddress) {
    try {
        const path = [usdtAddress, scarAddress];
        const amountIn = web3.utils.toWei(usdAmount, 'ether');

        const amounts = await routerContract.methods.swapExactTokensForTokens(
            amountIn,
            minScarAmount,
            path,
            toAddress,
            deadline
        ).send({from: walletAddress.address, gas: 3000000})
        .then(async (res) => {
            console.log(`swapUSDTtoScar: txHash ${res.transactionHash}`);
            //logger.debug(`swapUSDTtoScar: txHash ${res.transactionHash}`);
            return res.transactionHash
        })
        .catch((error) => {
            console.log(error);
            //logger.error(error);
        });
        
        const amountOfScar = amounts[1]; // Amount of SCAR token in smallest units
        return amountOfScar;
    } catch (error) {
        console.error('Error:', error);
        return error
    }
}

async function fetchMarketList() {   
    try {
        let item721 = await client.get(`marketList:721`);
        let item1155 = await client.get(`marketList:1155`);
        let item1155_2 = await client.get(`marketList:1155_2`);
        
        let marketItems = { item721:item721, item1155:item1155, item1155_2:item1155_2}
        //console.log("fetchMarketList: ", marketItems);
        //logger.debug("fetchMarketList: ", marketItems);
        return JSON.stringify(marketItems)
    }catch (error) {
        console.error('fetchMarketList:', error);
       // logger.error('fetchMarketList', error);
    }
}


// Router endpoints

app.use(bodyParser.json());

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

  app.get('/api/marketplace/list', async (req, res) => {
    const marketList = await fetchMarketList(); 
    res.json(marketList);
  });
  

app.post('/api/scar/convert', async (req, res) => {
    try {
        const usdAmount = req.body.usdAmount;
        console.log("Request Input usdAmount: ", usdAmount)
        const amountOfScar = await getScarFromUSDT(usdAmount)
        console.log("Response amountOfScar: ", amountOfScar)
        res.json({ scarAmount: amountOfScar });
    }catch (error) {
        res.status(500).json({ error: 'GetScarAmount: Internal Server Error' });
    }
});

app.post('/api/scar/swap', async (req, res) => {
    try {
        const toAddress = req.body.toAddress;
        const usdAmount = req.body.usdAmount;
        const fetchedAmount = req.body.fetchedAmount
        const currentAmount = await getScarFromUSDT(usdAmount, toAddress)

        if (fetchedAmount >= currentAmount) {
            const transactionHash = await swapUSDTtoScar(usdAmount)
            res.json({ success: true, txHash: transactionHash });
        }else {
            res.json({ success: false, txHash: ""})
        }
        
    }catch (error) {
        res.status(500).json({ error: 'Swap: Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://${HOST_DOMAIN}:${PORT}`);
});
