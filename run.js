const { ethers } = require("ethers");
require("colors");

async function runIzumiBot() {
    console.log("Menjalankan Izumi Bot...");
require('dotenv').config();
const { ethers } = require('ethers'); // Import ethers.js v6
const colors = require('colors');
const readline = require('readline');
const fs = require('fs');

const RPC_URL = 'https://testnet-rpc.monad.xyz/';
const EXPLORER_URL = 'https://testnet.monadexplorer.com/tx/';
const WMON_CONTRACT = '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701';

// Membaca daftar private key dan proxy dari file
const wallets = fs.readFileSync('wallet.txt', 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
const proxies = fs.readFileSync('proxy.txt', 'utf8').split('\n').map(line => line.trim()).filter(Boolean);

if (wallets.length === 0 || proxies.length === 0) {
  console.error('❌ Please ensure wallet.txt and proxy.txt are not empty.'.red);
  process.exit(1);
}

// Fungsi untuk mendapatkan jumlah MON acak (tetap di 0.02 untuk stabilitas)
function getRandomAmount() {
  return ethers.parseEther("0.02"); // Menggunakan ethers.parseEther langsung di v6
}

// Fungsi untuk mendapatkan delay acak antara 60 - 80 detik
function getRandomDelay() {
  return Math.floor(Math.random() * (80000 - 60000 + 1)) + 60000;
}

// Fungsi untuk mendapatkan gas limit acak antara 80.000 - 140.000
function getRandomGasLimit() {
  return Math.floor(Math.random() * (140000 - 120000 + 1)) + 120000;
}

// Fungsi untuk wrap MON menjadi WMON
async function wrapMON(wallet, amount) {
  try {
    const gasLimit = getRandomGasLimit();
    console.log(`🔄 Wrapping ${ethers.formatEther(amount)} MON into WMON (Gas Limit: ${gasLimit})...`.magenta);
    
    const contract = new ethers.Contract(
      WMON_CONTRACT,
      ['function deposit() public payable', 'function withdraw(uint256 amount) public'],
      wallet
    );

    const tx = await contract.deposit({ value: amount, gasLimit });
    console.log(`✔️ Wrap MON → WMON successful`.green.underline);
    console.log(`➡️ Transaction sent: ${EXPLORER_URL}${tx.hash}`.yellow);
    await tx.wait();
  } catch (error) {
    console.error('❌ Error wrapping MON:'.red, error);
  }
}

// Fungsi untuk unwrap WMON menjadi MON
async function unwrapMON(wallet, amount) {
  try {
    const gasLimit = getRandomGasLimit();
    console.log(`🔄 Unwrapping ${ethers.formatEther(amount)} WMON back to MON (Gas Limit: ${gasLimit})...`.magenta);

    const contract = new ethers.Contract(
      WMON_CONTRACT,
      ['function deposit() public payable', 'function withdraw(uint256 amount) public'],
      wallet
    );

    const tx = await contract.withdraw(amount, { gasLimit });
    console.log(`✔️ Unwrap WMON → MON successful`.green.underline);
    console.log(`➡️ Transaction sent: ${EXPLORER_URL}${tx.hash}`.yellow);
    await tx.wait();
  } catch (error) {
    console.error('❌ Error unwrapping WMON:'.red, error);
  }
}

// Fungsi untuk menjalankan swap cycle berdasarkan input pengguna
async function runSwapCycle(wallet, cycles) {
  for (let i = 0; i < cycles; i++) {
    console.log(`🔄 Cycle ${i + 1} of ${cycles} for ${wallet.address}`.magenta);
    
    const randomAmount = getRandomAmount();
    await wrapMON(wallet, randomAmount);
    await unwrapMON(wallet, randomAmount);

    if (i < cycles - 1) {
      const randomDelay = getRandomDelay();
      console.log(`⏳ Waiting ${randomDelay / 1000} seconds before next cycle...`.yellow);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
    }
  }
  console.log(`✅ All ${cycles} cycles completed for ${wallet.address}`.green);
}

// Fungsi untuk menunggu sampai jam 09:00 pagi
function waitUntilNextRun() {
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(9, 0, 0, 0);

  if (now > nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeToWait = nextRun - now;
  console.log(`⏳ Waiting until 09:00 AM to restart... (${Math.round(timeToWait / 1000 / 60)} minutes left)`.cyan);

  setTimeout(startProcess, timeToWait);
}

// Fungsi utama untuk menjalankan semua akun
async function startProcess() {
  console.log(`🚀 Starting swap cycles...`.yellow);

  const tasks = wallets.map(async (privateKey, i) => {
    try {
      const proxy = proxies[i % proxies.length];

      // Inisialisasi provider dengan proxy (ethers.js v6)
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      provider.connection = {
        url: RPC_URL,
        headers: {
          'Proxy-Authorization': `Basic ${Buffer.from(proxy.split('@')[0]).toString('base64')}`,
        },
      };

      const wallet = new ethers.Wallet(privateKey, provider);

      console.log(`\n🟢 Starting operations for account ${wallet.address} using proxy ${proxy}`.cyan);
      await runSwapCycle(wallet, globalCycleCount);
    } catch (error) {
      console.error(`❌ Error processing wallet: ${error.message}`.red);
    }
  });

  await Promise.all(tasks);

  console.log(`\n✅ All swap cycles completed for all accounts!`.green.bold);
  waitUntilNextRun();
}

// Fungsi untuk meminta input dari pengguna
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('How many swap cycles would you like to run? ', (cycles) => {
  let cycleCount = parseInt(cycles);
  if (isNaN(cycleCount) || cycleCount <= 0) {
    console.error('❌ Please enter a valid positive number!'.red);
    rl.close();
    process.exit(1);
  }

  global.globalCycleCount = cycleCount;
  console.log(`\n🚀 Swap cycles set to run ${cycleCount} times daily at 09:00 AM...`.yellow);

  rl.close();
  startProcess();
});

}

async function runMagmaBot() {
    console.log("Menjalankan Magma Bot...");
require('dotenv').config();
const { ethers } = require('ethers'); // Import ethers.js v6
const colors = require('colors');
const fs = require('fs');
const readline = require('readline');

const RPC_URL = "https://monad-testnet.g.alchemy.com/v2/3DN4EyaWIGRgyimE133RK7jwBvmq-ADi/";
const EXPLORER_URL = 'https://testnet.monadexplorer.com/tx/';
const contractAddress = '0x2c9C959516e9AAEdB2C748224a41249202ca8BE7';

function getRandomGas(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const gasLimitStake = getRandomGas(120000, 140000);
const gasLimitUnstake = getRandomGas(120000, 140000);

const wallets = fs.readFileSync('wallet.txt', 'utf8')
  .split(/\r?\n/)
  .map(line => line.trim().replace(/\r/g, ''))
  .filter(Boolean);

const proxies = fs.readFileSync('proxy.txt', 'utf8')
  .split(/\r?\n/)
  .map(line => line.trim().replace(/\r/g, ''))
  .filter(Boolean);

if (wallets.length === 0 || proxies.length === 0) {
  console.error('❌ Please ensure wallet.txt and proxy.txt are not empty.'.red);
  process.exit(1);
}

function getRandomAmount() {
  return ethers.parseEther((Math.random() * (0.2 - 0.2) + 0.2).toFixed(4)); // Menggunakan ethers.parseEther langsung di v6
}

function getRandomDelay() {
  return Math.floor(Math.random() * (80000 - 60000 + 1) + 60000);
}

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function stakeMON(wallet, cycleNumber) {
  try {
    console.log(`\n[Cycle ${cycleNumber}] Preparing to stake MON...`.magenta);

    const stakeAmount = getRandomAmount();
    console.log(`➡️  Staking ${ethers.formatEther(stakeAmount)} MON`); // Menggunakan ethers.formatEther langsung di v6

    const tx = {
      to: contractAddress,
      data: '0xd5575982',
      gasLimit: ethers.toBeHex(gasLimitStake), // Menggunakan ethers.toBeHex di v6
      value: stakeAmount,
    };

    console.log('🔄 Sending stake transaction...');
    const txResponse = await wallet.sendTransaction(tx);
    console.log(`✅ Transaction sent: ${EXPLORER_URL}${txResponse.hash}`.yellow);

    console.log('🔄 Waiting for confirmation...');
    await txResponse.wait();
    console.log(`✔️  Stake successful!`.green);

    return { stakeAmount };
  } catch (error) {
    console.error('❌ Staking failed:', error.message.red);
    throw error;
  }
}

async function unstakeGMON(wallet, amountToUnstake, cycleNumber) {
  try {
    console.log(`\n[Cycle ${cycleNumber}] Preparing to unstake gMON...`.magenta);
    console.log(`➡️  Unstaking ${ethers.formatEther(amountToUnstake)} gMON`); // Menggunakan ethers.formatEther langsung di v6

    const data = '0x6fed1ea7' + ethers.zeroPadValue(ethers.toBeHex(amountToUnstake), 32).slice(2); // Menggunakan ethers.zeroPadValue dan ethers.toBeHex di v6

    const tx = {
      to: contractAddress,
      data: data,
      gasLimit: ethers.toBeHex(gasLimitUnstake), // Menggunakan ethers.toBeHex di v6
    };

    console.log('🔄 Sending unstake transaction...');
    const txResponse = await wallet.sendTransaction(tx);
    console.log(`✅ Transaction sent: ${EXPLORER_URL}${txResponse.hash}`.yellow);

    console.log('🔄 Waiting for confirmation...');
    await txResponse.wait();
    console.log(`✔️  Unstake successful!`.green);

  } catch (error) {
    console.error('❌ Unstaking failed:', error.message.red);
    throw error;
  }
}

async function runCycle(wallet, cycleNumber) {
  try {
    console.log(`\n=== Starting Cycle ${cycleNumber} ===`.magenta.bold);

    const { stakeAmount } = await stakeMON(wallet, cycleNumber);
    const delayTime = getRandomDelay();
    console.log(`⏳ Waiting ${delayTime / 1000} seconds before unstaking...`);
    await delay(delayTime);

    await unstakeGMON(wallet, stakeAmount, cycleNumber);

    console.log(`🎉 Cycle ${cycleNumber} completed successfully!`.magenta.bold);
  } catch (error) {
    console.error(`❌ Cycle ${cycleNumber} failed:`, error.message.red);
  }
}

function waitUntilNextRun() {
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(9, 0, 0, 0);

  if (now > nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeToWait = nextRun - now;
  console.log(`⏳ Waiting until 09:00 AM to restart... (${Math.round(timeToWait / 1000 / 60)} minutes left)`.cyan);

  setTimeout(startProcess, timeToWait);
}

async function startProcess() {
  console.log('🚀 Starting Magma Staking operations...'.green);

  const tasks = wallets.map(async (privateKey, i) => {
    try {
      const proxy = proxies[i % proxies.length];

      // Inisialisasi provider dengan proxy (ethers.js v6)
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      provider.connection = {
        url: RPC_URL,
        headers: {
          'Proxy-Authorization': `Basic ${Buffer.from(proxy.split('@')[0]).toString('base64')}`,
        },
      };

      const wallet = new ethers.Wallet(privateKey, provider);

      console.log(`\n🟢 Starting operations for account ${wallet.address} using proxy ${proxy}`.cyan);

      for (let j = 1; j <= globalCycleCount; j++) {
        console.log(`\n=== Starting Cycle ${j} for account ${wallet.address} ===`.magenta.bold);

        await runCycle(wallet, j);

        if (j < globalCycleCount) {
          const interCycleDelay = getRandomDelay();
          console.log(`⏳ Waiting ${interCycleDelay / 1000} seconds before next cycle...`);
          await delay(interCycleDelay);
        }
      }
    } catch (err) {
      console.error(`❌ Error processing wallet: ${err.message}`.red);
    }
  });

  await Promise.all(tasks);

  console.log(`\n✅ All cycles completed successfully for all accounts!`.green.bold);
  waitUntilNextRun();
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('How many staking cycles would you like to run? ', (answer) => {
  let cycleCount = parseInt(answer);
  if (isNaN(cycleCount) || cycleCount <= 0) {
    console.error('❌ Please enter a valid positive number!'.red);
    rl.close();
    process.exit(1);
  }

  global.globalCycleCount = cycleCount;
  console.log(`\n🚀 Staking cycles set to run ${cycleCount} times daily at 09:00 AM...`.yellow);

  rl.close();
  startProcess();
});
}

async function runRubicBot() {
    console.log("Menjalankan Rubic Bot...");
require('dotenv').config();
const { ethers } = require('ethers'); // Import ethers.js v6
const colors = require('colors');
const fs = require('fs');
const readline = require('readline');

const RPC_URL = 'https://monad-testnet.g.alchemy.com/v2/3DN4EyaWIGRgyimE133RK7jwBvmq-ADi/';
const EXPLORER_URL = 'https://testnet.monadexplorer.com/tx/';
const WMON_CONTRACT = '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701';

// Membaca daftar private key dan proxy dari file
const wallets = fs.readFileSync('wallet.txt', 'utf8').split('\n').map(line => line.trim()).filter(Boolean);
const proxies = fs.readFileSync('proxy.txt', 'utf8').split('\n').map(line => line.trim()).filter(Boolean);

if (wallets.length === 0 || proxies.length === 0) {
  console.error('❌ Please ensure wallet.txt and proxy.txt are not empty.'.red);
  process.exit(1);
}

// Fungsi mendapatkan jumlah MON acak antara 0.01 hingga 0.05
function getRandomAmount() {
  return ethers.parseEther((Math.random() * (0.1 - 0.1) + 0.1).toFixed(4)); // Menggunakan ethers.parseEther langsung di v6
}

// Fungsi mendapatkan delay acak antara 1 - 3 menit (dalam ms)
function getRandomDelay() {
  return Math.floor(Math.random() * (1 * 60 * 1000 - 1 * 60 * 1000 + 1)) + 1 * 60 * 1000;
}

// Fungsi mendapatkan gas limit acak antara 80.000 - 140.000
function getRandomGasLimit() {
  return Math.floor(Math.random() * (140000 - 80000 + 1)) + 80000;
}

// Fungsi wrap MON → WMON
async function wrapMON(wallet, amount) {
  try {
    console.log(`🔄 Wrapping ${ethers.formatEther(amount)} MON into WMON...`.magenta); // Menggunakan ethers.formatEther langsung di v6

    const contract = new ethers.Contract(
      WMON_CONTRACT,
      ['function deposit() public payable', 'function withdraw(uint256 amount) public'],
      wallet
    );

    const tx = await contract.deposit({ value: amount, gasLimit: getRandomGasLimit() });
    console.log(`✔️ Wrap MON → WMON successful`.green.underline);
    console.log(`➡️ Transaction sent: ${EXPLORER_URL}${tx.hash}`.yellow);
    await tx.wait();
  } catch (error) {
    console.error('❌ Error wrapping MON:'.red, error);
  }
}

// Fungsi unwrap WMON → MON
async function unwrapMON(wallet, amount) {
  try {
    console.log(`🔄 Unwrapping ${ethers.formatEther(amount)} WMON back to MON...`.magenta); // Menggunakan ethers.formatEther langsung di v6

    const contract = new ethers.Contract(
      WMON_CONTRACT,
      ['function deposit() public payable', 'function withdraw(uint256 amount) public'],
      wallet
    );

    const tx = await contract.withdraw(amount, { gasLimit: getRandomGasLimit() });
    console.log(`✔️ Unwrap WMON → MON successful`.green.underline);
    console.log(`➡️ Transaction sent: ${EXPLORER_URL}${tx.hash}`.yellow);
    await tx.wait();
  } catch (error) {
    console.error('❌ Error unwrapping WMON:'.red, error);
  }
}

// Fungsi menjalankan swap cycle untuk 1 wallet
async function runSwapCycle(wallet, cycles) {
  for (let cycle = 1; cycle <= cycles; cycle++) {
    console.log(`\n🔄 Cycle ${cycle} of ${cycles} for ${wallet.address}`.magenta);

    const randomAmount = getRandomAmount();
    await wrapMON(wallet, randomAmount);
    await unwrapMON(wallet, randomAmount);

    if (cycle < cycles) {
      const randomDelay = getRandomDelay();
      console.log(`⏳ Waiting ${randomDelay / 1000 / 60} minute(s) before next cycle...`.yellow);
      await new Promise(resolve => setTimeout(resolve, randomDelay));
    }
  }
  console.log(`✅ All ${cycles} cycles completed for ${wallet.address}`.green);
}

// Fungsi menunggu hingga jam 09:00 pagi untuk restart ulang
function waitUntilNextRun() {
  const now = new Date();
  const nextRun = new Date();
  nextRun.setHours(9, 0, 0, 0); // Set jam 09:00 pagi

  if (now > nextRun) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  const timeToWait = nextRun - now;
  console.log(`⏳ Waiting until 09:00 AM to restart... (${Math.round(timeToWait / 1000 / 60)} minutes left)`.cyan);

  setTimeout(startProcess, timeToWait);
}

// Fungsi utama menjalankan swap untuk semua akun secara paralel
async function startProcess() {
  console.log(`🚀 Starting swap cycles...`.yellow);

  const promises = wallets.map(async (privateKey, i) => {
    const proxy = proxies[i % proxies.length];

    // Inisialisasi provider dengan proxy (ethers.js v6)
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    provider.connection = {
      url: RPC_URL,
      headers: {
        'Proxy-Authorization': `Basic ${Buffer.from(proxy.split('@')[0]).toString('base64')}`,
      },
    };

    const wallet = new ethers.Wallet(privateKey, provider);

    console.log(`\n🟢 Starting operations for account ${wallet.address} using proxy ${proxy}`.cyan);
    await runSwapCycle(wallet, globalCyclesCount);
  });

  // Tunggu semua akun selesai
  await Promise.all(promises);

  console.log(`\n✅ All swap cycles completed for all accounts!`.green.bold);

  // Tunggu hingga jam 09:00 pagi untuk restart ulang
  waitUntilNextRun();
}

// Fungsi untuk meminta input jumlah cycle dari pengguna
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('How many swap cycles would you like to run? ', (cycles) => {
  let cyclesCount = parseInt(cycles);

  if (isNaN(cyclesCount) || cyclesCount <= 0) {
    console.log('❌ Invalid input. Please enter a positive number.'.red);
    rl.close();
    return;
  }

  global.globalCyclesCount = cyclesCount; // Simpan jumlah cycles global

  console.log(`\n🚀 Swap cycles set to run ${cyclesCount} times daily at 09:00 AM...`.yellow);

  rl.close();
  startProcess();
});
}

// Fungsi untuk menampilkan header berwarna
function displayHeader() { 
  process.stdout.write("\x1Bc");
  console.log("========================================".rainbow);
  console.log("=           MONAD AUTO AIO             =".bold.green);
  console.log("=     RUBIC - APRIORI - MAGMA - IZUMI  =".bold.cyan);
  console.log("========================================".rainbow);
  console.log();
}

// Fungsi animasi loading sederhana
function loadingAnimation(text, duration = 2000) {
  return new Promise((resolve) => {
    let dots = "";
    const interval = setInterval(() => {
      process.stdout.write(`\r${text}${dots}`.yellow);
      dots = dots.length < 3 ? dots + "." : "";
    }, 500);
    
    setTimeout(() => {
      clearInterval(interval);
      console.log(`\r${text} ✅`.green);
      resolve();
    }, duration);
  });
}

async function main() {
  displayHeader();

  console.log("🔵 Pilih bot yang ingin dijalankan:\n".bold);
  console.log(`1️⃣  ${"Izumi Bot".magenta}`);
  console.log(`2️⃣  ${"Magma Bot".blue}`);
  console.log(`3️⃣  ${"Rubic Bot".yellow}`);
  console.log();

  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question("💡 Masukkan nomor bot yang ingin dijalankan: ".bold, async (choice) => {
    readline.close();
    console.log();

    switch (choice) {
      case "1":
        await loadingAnimation("🔄 Menjalankan Izumi Bot");
        await runIzumiBot();
        break;
      case "2":
        await loadingAnimation("🔄 Menjalankan Magma Bot");
        await runMagmaBot();
        break;
      case "3":
        await loadingAnimation("🔄 Menjalankan Rubic Bot");
        await runRubicBot();
        break;
      default:
        console.log("❌ Pilihan tidak valid, silakan coba lagi.".red.bold);
    }
  });
}

// Jalankan program
main();
