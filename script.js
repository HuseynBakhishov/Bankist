'use strict';

const account1 = {
  owner: 'Mark Anderson',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2021-03-29T17:01:17.194Z',
    '2021-03-31T19:36:17.929Z',
    '2021-04-01T10:51:36.790Z',
  ],
  currency: 'EUR',
  local: 'pt-PT',
};

const account2 = {
  owner: 'Lauren Rogers',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  local: 'en-US',
};

const accounts = [account1, account2];

//Tracking
let currentAccount, timer;
let sorted = false;

//Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance-value');
const labelSumIn = document.querySelector('.value-in');
const labelSumOut = document.querySelector('.value-out');
const labelSumInterest = document.querySelector('.value-interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login-btn');
const btnTransfer = document.querySelector('.btn-transfer');
const btnLoan = document.querySelector('.btn-loan');
const btnClose = document.querySelector('.btn-close');
const btnSort = document.querySelector('.btn-sort');

const inputLoginUsername = document.querySelector('.input-user');
const inputLoginPin = document.querySelector('.login-input-pin');
const inputTransferTo = document.querySelector('.input-to');
const inputTransferAmount = document.querySelector('.input-amount');
const inputLoanAmount = document.querySelector('.input-loan-amount');
const inputCloseUsername = document.querySelector('.input-user');
const inputClosePin = document.querySelector('.close-input-pin');

//Time
const now = new Date();
const options = {
  year: `numeric`,
  month: `numeric`,
  day: `numeric`,
  hour: `numeric`,
  minute: `numeric`,
};

convertUsername(accounts);
btnClose.addEventListener(`click`, close);
btnLoan.addEventListener(`click`, request);
btnLogin.addEventListener(`click`, login);
btnTransfer.addEventListener(`click`, transfer);
btnSort.addEventListener(`click`, sortMovements);

function login(e) {
  e.preventDefault();
  sorted = false;
  currentAccount = accounts.find(
    acc => acc.username === inputLoginUsername.value
  );
  if (currentAccount?.pin === Number(inputLoginPin.value)) {
    updateUI(currentAccount);

    if (timer) clearInterval(timer);
    timer = logout();

    labelWelcome.textContent = `Welcome back, ${
      currentAccount.owner.split(` `)[0]
    }`;

    labelDate.textContent = new Intl.DateTimeFormat(
      currentAccount.local,
      options
    ).format(now);

    containerApp.style.opacity = `1`;
    inputLoginUsername.value = ``;
    inputLoginPin.value = ``;
    inputLoginPin.blur(); //to lose focus
  } else {
    alert(`Wrong credentials`);
  }
}

function formatCurrency(local, currency, value) {
  return new Intl.NumberFormat(local, {
    style: `currency`,
    currency: currency,
  }).format(value);
}

function updateUI(account) {
  calcBalance(account);
  calcSummary(account);
  displayMovements(account);
}

function calcBalance(account) {
  account.balance = account.movements.reduce((acc, mov) => acc + mov, 0);
  labelBalance.textContent = formatCurrency(
    account.local,
    account.currency,
    account.balance
  );
}

function displayMovements(account, sorted = false) {
  containerMovements.innerHTML = ``;

  const movs = sorted
    ? account.movements.slice().sort((a, b) => a - b)
    : account.movements;

  movs.forEach((mov, i) => {
    const type = mov > 0 ? `deposit` : `withdrawal`;

    //movements.length === movementDates.length. So i represents both movement's and date's index
    const date = new Date(account.movementsDates[i]);
    const displayDate = formatDate(date);

    const html = `
    <div class="movements-row">
      <div class="movements-type movements-${type}">${i + 1} ${type}</div>
      <div class="movements-date">${displayDate}</div>
      <div class="movements-value">${formatCurrency(
        account.local,
        account.currency,
        mov
      )}</div>
    </div>
  `;
    containerMovements.insertAdjacentHTML(`afterbegin`, html);
  });
}

function sortMovements(e) {
  e.preventDefault();
  displayMovements(currentAccount, !sorted);
  sorted = !sorted;
}

function calcSummary(account) {
  const income = account.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  const outcome = account.movements
    .filter(mov => mov < 0)
    .reduce((acc, withdrawal) => acc + Math.abs(withdrawal), 0);
  const interest = account.movements
    .filter(mov => mov > 0)
    .map(deposit => deposit * (account.interestRate / 100))
    .filter(int => int >= 1)
    .reduce((acc, int) => acc + int, 0);

  labelSumIn.textContent = formatCurrency(
    account.local,
    account.currency,
    income
  );
  labelSumOut.textContent = formatCurrency(
    account.local,
    account.currency,
    outcome
  );
  labelSumInterest.textContent = formatCurrency(
    account.local,
    account.currency,
    interest
  );
}

function formatDate(date) {
  function calcDaysPassed(date1, date2) {
    return Math.round(Math.abs(date2 - date1) / 86400000);
  }

  const daysPassed = calcDaysPassed(now, date);

  if (daysPassed === 0) {
    return `Today`;
  } else if (daysPassed === 1) {
    return `Yesterday`;
  } else if (daysPassed <= 7) {
    return `${daysPassed} days ago`;
  } else {
    return new Intl.DateTimeFormat(currentAccount.local, options).format(date);
  }
}

function logout() {
  //10 min = 600 sec
  let time = 600;

  function tick() {
    const min = String(Math.trunc(time / 60)).padStart(2, 0);
    const sec = String(time % 60).padStart(2, 0);

    if (time === 0) {
      cleanInterval(timer);
      containerApp.style.opacity = 0;
      labelWelcome.textContent = `Log in to get started`;
    }

    labelTimer.textContent = `${min}:${sec}`;
    time--;
  }
  //As function starts executing after 1 sec, it is needed to call separately.
  tick();
  timer = setInterval(tick, 1000);
  return timer;
}

function request(e) {
  e.preventDefault();
  const loanAmount = Math.floor(inputLoanAmount.value);
  if (
    loanAmount > 0 &&
    currentAccount.movements.some(mov => mov >= loanAmount * 0.1)
  ) {
    clearInterval(timer);
    timer = logout();

    setTimeout(() => {
      currentAccount.movements.push(loanAmount);
      currentAccount.movementsDates.push(new Date().toISOString());
      updateUI(currentAccount);
    }, 5000);
  } else {
    alert(`Unfortunately, you cannot take loan`);
  }
  inputLoanAmount.value = ``;
}

function close(e) {
  e.preventDefault();

  if (
    inputCloseUsername.value === currentAccount.username &&
    Number(inputClosePin.value) === currentAccount.pin
  ) {
    accounts.splice(
      accounts.findIndex(
        account => account.username === currentAccount.username
      ),
      1
    );

    containerApp.style.opacity = 0;
    labelWelcome.textContent = `Log in to get started`;
  } else {
    alert(`Wrong credentials`);
  }
}

function transfer(e) {
  e.preventDefault();
  const amount = Number(inputTransferAmount.value);
  const receiver = accounts.find(
    account => account.username === inputTransferTo.value
  );
  if (
    amount > 0 &&
    receiver &&
    currentAccount.balance >= amount &&
    receiver?.username !== currentAccount.username
  ) {
    clearInterval(timer);
    timer = logout();

    currentAccount.balance -= amount;
    currentAccount.movements.push(-amount);
    currentAccount.movementsDates.push(new Date().toISOString());

    receiver.balance += amount;
    receiver.movements.push(amount);
    receiver.movementsDates.push(new Date().toISOString());

    inputTransferTo.value = ``;
    inputTransferAmount.value = ``;

    updateUI(currentAccount);
  } else {
    alert(`Invalid process`);
  }
}

function convertUsername(accs) {
  accs.forEach(function (acc) {
    acc.username = acc.owner
      .toLowerCase()
      .split(` `)
      .map(word => word[0])
      .join(``);
  });
}
